use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::State;
use axum::middleware;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use world_id_core::requests::{ProofRequest, RequestItem};
use world_id_core::{Authenticator, Credential, CredentialInput};

use crate::auth::bearer_auth;
use crate::error::SidecarError;
use crate::persona::{
    available_for_persona, identity_attributes_match, includes_persona_document_schema,
    IdentityAttribute, IdentityPersona,
};

/// Shared application state.
pub struct AppState {
    pub identities: Vec<IdentityState>,
}

/// State for a single pre-configured identity.
pub struct IdentityState {
    pub authenticator: Authenticator,
    pub credentials: Vec<Credential>,
}

/// Request body for proof generation endpoints.
#[derive(Debug, Deserialize)]
pub struct ProofRequestBody {
    /// Deprecated and ignored: the identity is now auto-selected from the requested
    /// credentials. Kept in the schema for backwards compatibility so existing callers
    /// that still send it don't break.
    #[serde(default)]
    pub identity_index: Option<usize>,
    /// The ProofRequest from the bridge payload (passed through from IDKit).
    pub proof_request: serde_json::Value,
    /// Identity Check attributes requested by the bridge payload.
    pub identity_attributes: Option<Vec<IdentityAttribute>>,
    /// Simulator persona for the selected identity. Required with identity_attributes.
    pub persona: Option<IdentityPersona>,
}

/// Identity info returned by GET /identities.
#[derive(Serialize)]
pub struct IdentityInfo {
    pub index: usize,
    pub leaf_index: u64,
    pub credentials: Vec<CredentialInfo>,
}

#[derive(Serialize)]
pub struct CredentialInfo {
    pub issuer_schema_id: u64,
    pub expires_at: u64,
}

/// Build the axum router.
pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/proof/uniqueness", post(generate_uniqueness_proof))
        .route("/proof/session", post(generate_session_proof))
        .route("/identities", get(list_identities))
        .route("/health", get(health))
        .layer(middleware::from_fn(bearer_auth))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({"ok": true}))
}

async fn list_identities(State(state): State<Arc<AppState>>) -> Json<Vec<IdentityInfo>> {
    let identities = state
        .identities
        .iter()
        .enumerate()
        .map(|(i, identity)| IdentityInfo {
            index: i,
            leaf_index: identity.authenticator.leaf_index(),
            credentials: identity
                .credentials
                .iter()
                .map(|c| CredentialInfo {
                    issuer_schema_id: c.issuer_schema_id,
                    expires_at: c.expires_at,
                })
                .collect(),
        })
        .collect();

    Json(identities)
}

async fn generate_uniqueness_proof(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ProofRequestBody>,
) -> Result<Json<serde_json::Value>, SidecarError> {
    generate_proof_inner(&state, req, false).await
}

async fn generate_session_proof(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ProofRequestBody>,
) -> Result<Json<serde_json::Value>, SidecarError> {
    generate_proof_inner(&state, req, true).await
}

/// Available credential schema ids for a single identity.
fn available_schema_ids(
    identity: &IdentityState,
    persona: Option<&IdentityPersona>,
) -> HashSet<u64> {
    let available = identity
        .credentials
        .iter()
        .map(|c| c.issuer_schema_id)
        .collect();
    available_for_persona(&available, persona)
}

/// Selects the first identity (in config order) that can satisfy the proof request, returning
/// its index and the request items to prove.
///
/// Pure and side-effect free - it only consults `ProofRequest::credentials_to_prove`, which
/// checks schema-id availability and any constraint expression. It does NOT verify
/// `expires_at_min` / `genesis_issued_at_min`; those are enforced later inside
/// `generate_proof`, so a match here is necessary but not a full guarantee of success.
///
/// Takes the available schema ids lazily so production can stream them from `state.identities`
/// without an intermediate allocation, while tests pass hand-built sets.
fn select_identity(
    available_per_identity: impl IntoIterator<Item = HashSet<u64>>,
    proof_request: &ProofRequest,
) -> Option<(usize, Vec<&RequestItem>)> {
    available_per_identity
        .into_iter()
        .enumerate()
        .find_map(|(index, available)| {
            proof_request
                .credentials_to_prove(&available)
                .map(|items| (index, items))
        })
}

/// Core proof generation logic shared between uniqueness and session proofs.
async fn generate_proof_inner(
    state: &AppState,
    req: ProofRequestBody,
    is_session: bool,
) -> Result<Json<serde_json::Value>, SidecarError> {
    let ProofRequestBody {
        identity_index,
        proof_request,
        identity_attributes,
        persona,
    } = req;

    if identity_index.is_some() {
        tracing::warn!(
            "identity_index is deprecated and ignored; identity is auto-selected from the requested credentials"
        );
    }

    let proof_request = ProofRequest::from_json(&proof_request.to_string())
        .map_err(|e| SidecarError::BadRequest(format!("invalid proof_request: {e}")))?;

    if is_session != proof_request.is_session_proof() {
        return Err(SidecarError::BadRequest(
            "proof request type did not match endpoint".to_string(),
        ));
    }

    let is_identity_check = identity_attributes.is_some();
    let identity_attributes = identity_attributes.unwrap_or_default();
    if is_identity_check && is_session {
        return Err(SidecarError::BadRequest(
            "identity check is only supported for uniqueness proofs".to_string(),
        ));
    }
    let persona = if is_identity_check {
        let persona = persona
            .as_ref()
            .ok_or(SidecarError::CredentialUnavailable)?;
        if !persona.is_valid() {
            return Err(SidecarError::BadRequest(
                "persona contains invalid identity details".to_string(),
            ));
        }
        Some(persona)
    } else {
        None
    };

    // Auto-select: pick the first configured identity whose credentials satisfy the request.
    // Identity Check restricts Passport/MNC availability to the selected persona first.
    let available = state
        .identities
        .iter()
        .map(|identity| available_schema_ids(identity, persona));
    let (selected_index, items_to_prove) =
        select_identity(available, &proof_request).ok_or(SidecarError::CredentialUnavailable)?;

    validate_identity_check_selection(
        persona,
        &identity_attributes,
        items_to_prove.iter().map(|item| item.issuer_schema_id),
    )?;

    let identity = &state.identities[selected_index];
    tracing::info!(selected_index, "auto-selected identity for proof request");

    let account_inclusion_proof = identity
        .authenticator
        .fetch_inclusion_proof()
        .await
        .map_err(SidecarError::from)?;

    let nullifier = identity
        .authenticator
        .generate_nullifier(&proof_request, Some(account_inclusion_proof.clone()))
        .await
        .map_err(SidecarError::from)?;

    let mut credentials = Vec::with_capacity(items_to_prove.len());
    for item in items_to_prove {
        let credential = identity
            .credentials
            .iter()
            .find(|c| c.issuer_schema_id == item.issuer_schema_id)
            .ok_or(SidecarError::CredentialUnavailable)?;

        let blinding_factor = identity
            .authenticator
            .generate_credential_blinding_factor(item.issuer_schema_id)
            .await
            .map_err(SidecarError::from)?;

        credentials.push(CredentialInput {
            credential: credential.clone(),
            blinding_factor,
        });
    }

    let result = identity
        .authenticator
        .generate_proof(
            &proof_request,
            nullifier,
            &credentials,
            Some(account_inclusion_proof),
            None,
        )
        .await
        .map_err(SidecarError::from)?;

    Ok(Json(bridge_response_payload(
        &result.proof_response,
        is_identity_check,
    )?))
}

fn validate_identity_check_selection<I>(
    persona: Option<&IdentityPersona>,
    identity_attributes: &[IdentityAttribute],
    proved_schema_ids: I,
) -> Result<(), SidecarError>
where
    I: IntoIterator<Item = u64>,
{
    let Some(persona) = persona else {
        return Ok(());
    };

    if !includes_persona_document_schema(proved_schema_ids, persona) {
        return Err(SidecarError::CredentialUnavailable);
    }

    if !identity_attributes_match(persona, identity_attributes) {
        return Err(SidecarError::IdentityAttributesNotMatched);
    }

    Ok(())
}

fn bridge_response_payload(
    proof_response: &impl Serialize,
    is_identity_check: bool,
) -> Result<serde_json::Value, SidecarError> {
    if is_identity_check {
        return Ok(serde_json::json!({
            "proof_response": proof_response,
            "identity_attested": true,
        }));
    }

    serde_json::to_value(proof_response)
        .map_err(|e| SidecarError::BadRequest(format!("invalid proof response: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::persona::{
        IdentityAttribute, IdentityPersona, PersonaDocumentType, MNC_ISSUER_SCHEMA_ID,
        PASSPORT_ISSUER_SCHEMA_ID,
    };

    const POH: u64 = 1;
    const PASSPORT: u64 = PASSPORT_ISSUER_SCHEMA_ID;
    const MNC: u64 = MNC_ISSUER_SCHEMA_ID;

    fn passport_persona() -> IdentityPersona {
        IdentityPersona {
            document_type: PersonaDocumentType::Passport,
            document_number: "X1234567".to_string(),
            issuing_country: "USA".to_string(),
            full_name: "John Doe".to_string(),
            age: 30,
            nationality: "USA".to_string(),
        }
    }

    /// Builds a valid uniqueness `ProofRequest` requesting the given (identifier, schema_id) items.
    /// `proof_type` is omitted, which `world_id_core` treats as uniqueness.
    fn proof_request(items: &[(&str, u64)]) -> ProofRequest {
        let reqs: Vec<String> = items
            .iter()
            .map(|(id, schema)| format!(r#"{{"identifier":"{id}","issuer_schema_id":{schema}}}"#))
            .collect();
        let json = format!(
            r#"{{
              "id": "req_test",
              "version": 1,
              "created_at": 1725381192,
              "expires_at": 1725381492,
              "rp_id": "rp_0000000000000001",
              "oprf_key_id": "0x1",
              "session_id": null,
              "action": "0x000000000000000000000000000000000000000000000000000000000000002a",
              "signature": "0xa1fd06f0d8ceb541f6096fe2e865063eac1ff085c9d2bac2eedcc9ed03804bfc18d956b38c5ac3a8f7e71fde43deff3bda254d369c699f3c7a3f8e6b8477a5f51c",
              "nonce": "0x0000000000000000000000000000000000000000000000000000000000000001",
              "proof_requests": [{}]
            }}"#,
            reqs.join(",")
        );
        ProofRequest::from_json(&json).expect("valid test proof request")
    }

    fn sets(per_identity: &[&[u64]]) -> Vec<HashSet<u64>> {
        per_identity
            .iter()
            .map(|s| s.iter().copied().collect())
            .collect()
    }

    fn selected_index(available: &[HashSet<u64>], request: &ProofRequest) -> Option<usize> {
        select_identity(available.iter().cloned(), request).map(|(index, _)| index)
    }

    #[test]
    fn identity_check_success_path_wraps_response_v2_1() {
        let proof_response = serde_json::json!({
            "id": "proof-id",
            "version": 2,
            "responses": [],
        });

        let payload = bridge_response_payload(&proof_response, true).unwrap();

        assert_eq!(payload["proof_response"], proof_response);
        assert_eq!(payload["identity_attested"], true);
        assert!(payload.get("id").is_none());
    }

    #[test]
    fn regular_v4_payload_stays_flat_response_v2() {
        let proof_response = serde_json::json!({
            "id": "proof-id",
            "version": 2,
            "responses": [],
        });

        let payload = bridge_response_payload(&proof_response, false).unwrap();

        assert_eq!(payload, proof_response);
        assert!(payload.get("proof_response").is_none());
        assert!(payload.get("identity_attested").is_none());
    }

    #[test]
    fn identity_check_mismatched_attributes_returns_identity_attributes_not_matched() {
        let persona = passport_persona();

        let result = validate_identity_check_selection(
            Some(&persona),
            &[IdentityAttribute::Nationality("CAN".to_string())],
            [PASSPORT],
        );

        assert!(matches!(
            result,
            Err(SidecarError::IdentityAttributesNotMatched)
        ));
    }

    #[test]
    fn identity_check_non_document_selection_returns_credential_unavailable() {
        let persona = passport_persona();

        let result = validate_identity_check_selection(Some(&persona), &[], [POH]);

        assert!(matches!(result, Err(SidecarError::CredentialUnavailable)));
    }

    #[test]
    fn empty_identity_attributes_still_requires_document_selection() {
        let persona = passport_persona();

        assert!(validate_identity_check_selection(Some(&persona), &[], [PASSPORT]).is_ok());
        assert!(matches!(
            validate_identity_check_selection(Some(&persona), &[], [MNC]),
            Err(SidecarError::CredentialUnavailable)
        ));
    }

    #[test]
    fn eid_persona_uses_passport_schema_for_identity_check() {
        let mut persona = passport_persona();
        persona.document_type = PersonaDocumentType::Eid;

        assert!(validate_identity_check_selection(
            Some(&persona),
            &[IdentityAttribute::DocumentType(
                crate::persona::RequestedDocumentType::Eid,
            )],
            [PASSPORT],
        )
        .is_ok());
        assert!(matches!(
            validate_identity_check_selection(Some(&persona), &[], [MNC]),
            Err(SidecarError::CredentialUnavailable)
        ));
    }

    #[test]
    fn selects_identity_holding_requested_credential() {
        let available = sets(&[&[POH, PASSPORT], &[MNC]]);

        let poh = proof_request(&[("orb", POH)]);
        assert_eq!(selected_index(&available, &poh), Some(0));

        let passport = proof_request(&[("passport", PASSPORT)]);
        assert_eq!(selected_index(&available, &passport), Some(0));

        let mnc = proof_request(&[("mnc", MNC)]);
        assert_eq!(selected_index(&available, &mnc), Some(1));
    }

    #[test]
    fn returns_selected_items_to_prove() {
        let available = sets(&[&[POH, PASSPORT], &[MNC]]);
        let mnc = proof_request(&[("mnc", MNC)]);
        let (index, items) = select_identity(available.iter().cloned(), &mnc).expect("matches");
        assert_eq!(index, 1);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].issuer_schema_id, MNC);
    }

    #[test]
    fn returns_none_when_no_identity_has_the_credential() {
        let available = sets(&[&[POH, PASSPORT], &[MNC]]);
        let selfie = proof_request(&[("selfie", 11)]);
        assert_eq!(selected_index(&available, &selfie), None);
    }

    #[test]
    fn first_match_wins_for_determinism() {
        let available = sets(&[&[POH], &[POH]]);
        let poh = proof_request(&[("orb", POH)]);
        assert_eq!(selected_index(&available, &poh), Some(0));
    }

    #[test]
    fn credentials_split_across_identities_cannot_be_satisfied() {
        let available = sets(&[&[POH, PASSPORT], &[MNC]]);
        let both = proof_request(&[("orb", POH), ("mnc", MNC)]);
        assert_eq!(selected_index(&available, &both), None);
    }

    #[test]
    fn persona_filters_auto_selection_to_selected_document_type() {
        let persona = passport_persona();
        let available = sets(&[&[POH, PASSPORT, MNC], &[MNC]])
            .iter()
            .map(|available| available_for_persona(available, Some(&persona)))
            .collect::<Vec<_>>();

        let passport = proof_request(&[("passport", PASSPORT)]);
        assert_eq!(selected_index(&available, &passport), Some(0));

        let mnc = proof_request(&[("mnc", MNC)]);
        assert_eq!(selected_index(&available, &mnc), None);
    }
}
