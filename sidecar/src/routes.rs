use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::State;
use axum::middleware;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use world_id_core::requests::ProofRequest;
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
    /// Index into the pre-configured identities array.
    pub identity_index: usize,
    /// The ProofRequest from the bridge payload (passed through from IDKit).
    pub proof_request: serde_json::Value,
    /// IDKit Identity Check attributes. Present for identityCheck(...).
    /// Empty means Identity Check with no attribute filters, not regular v4.
    pub identity_attributes: Option<Vec<IdentityAttribute>>,
    /// Simulator persona for the selected identity. Required when identity_attributes is present.
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

/// Core proof generation logic shared between uniqueness and session proofs.
async fn generate_proof_inner(
    state: &AppState,
    req: ProofRequestBody,
    is_session: bool,
) -> Result<Json<serde_json::Value>, SidecarError> {
    let identity = state
        .identities
        .get(req.identity_index)
        .ok_or(SidecarError::IdentityNotFound)?;

    let proof_request = ProofRequest::from_json(&req.proof_request.to_string())
        .map_err(|e| SidecarError::BadRequest(format!("invalid proof_request: {e}")))?;

    if is_session != proof_request.is_session_proof() {
        return Err(SidecarError::BadRequest(
            "proof request type did not match endpoint".to_string(),
        ));
    }

    let is_identity_check = req.identity_attributes.is_some();
    let identity_attributes = req.identity_attributes.unwrap_or_default();
    let persona = if is_identity_check {
        Some(req.persona.as_ref().ok_or_else(|| {
            SidecarError::BadRequest(
                "persona is required when identity_attributes are provided".to_string(),
            )
        })?)
    } else {
        None
    };

    // Check which credentials satisfy the request constraints.
    // Identity Check restricts Passport/MNC availability to the active persona
    // so a Passport persona cannot silently prove with an MNC credential.
    let available: HashSet<u64> = identity
        .credentials
        .iter()
        .map(|c| c.issuer_schema_id)
        .collect();
    let available = available_for_persona(&available, persona);

    let items_to_prove = proof_request
        .credentials_to_prove(&available)
        .ok_or(SidecarError::CredentialUnavailable)?;

    validate_identity_check_selection(
        persona,
        &identity_attributes,
        items_to_prove.iter().map(|item| item.issuer_schema_id),
    )?;

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

    let response_payload = bridge_response_payload(&result.proof_response, is_identity_check)?;

    Ok(Json(response_payload))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::persona::{
        IdentityAttribute, IdentityPersona, PersonaDocumentType, RequestedDocumentType,
        MNC_ISSUER_SCHEMA_ID, PASSPORT_ISSUER_SCHEMA_ID,
    };

    fn passport_persona() -> IdentityPersona {
        IdentityPersona {
            document_type: PersonaDocumentType::Passport,
            document_number: "X1234567".to_string(),
            issuing_country: "USA".to_string(),
            full_name: "Alex Example".to_string(),
            age: 30,
            nationality: "USA".to_string(),
        }
    }

    fn proof_response_json() -> serde_json::Value {
        serde_json::json!({
            "id": "req_identity_check",
            "version": 1,
            "responses": [{
                "identifier": "passport",
                "issuer_schema_id": PASSPORT_ISSUER_SCHEMA_ID,
                "proof": "0x00",
                "nullifier": "nil_00",
                "expires_at_min": 1735689600
            }]
        })
    }

    #[test]
    fn identity_check_success_path_wraps_response_v2_1() {
        let persona = passport_persona();

        validate_identity_check_selection(Some(&persona), &[], [PASSPORT_ISSUER_SCHEMA_ID])
            .unwrap();

        let payload = bridge_response_payload(&proof_response_json(), true).unwrap();

        assert!(payload.get("id").is_none());
        assert_eq!(payload["identity_attested"], true);
        assert_eq!(payload["proof_response"]["id"], "req_identity_check");
        assert_eq!(
            payload["proof_response"]["responses"][0]["issuer_schema_id"],
            PASSPORT_ISSUER_SCHEMA_ID
        );
    }

    #[test]
    fn regular_v4_payload_stays_flat_response_v2() {
        let payload = bridge_response_payload(&proof_response_json(), false).unwrap();

        assert_eq!(payload["id"], "req_identity_check");
        assert!(payload.get("proof_response").is_none());
        assert!(payload.get("identity_attested").is_none());
    }

    #[test]
    fn identity_check_mismatched_attributes_returns_identity_attributes_not_matched() {
        let persona = passport_persona();
        let result = validate_identity_check_selection(
            Some(&persona),
            &[IdentityAttribute::DocumentType(RequestedDocumentType::Mnc)],
            [PASSPORT_ISSUER_SCHEMA_ID],
        );

        assert!(matches!(
            result,
            Err(SidecarError::IdentityAttributesNotMatched)
        ));
    }

    #[test]
    fn identity_check_non_document_selection_returns_credential_unavailable() {
        let persona = passport_persona();
        let result = validate_identity_check_selection(Some(&persona), &[], [1]);

        assert!(matches!(result, Err(SidecarError::CredentialUnavailable)));
    }

    #[test]
    fn empty_identity_attributes_still_requires_document_selection() {
        let persona = passport_persona();

        assert!(validate_identity_check_selection(
            Some(&persona),
            &[],
            [PASSPORT_ISSUER_SCHEMA_ID],
        )
        .is_ok());

        assert!(matches!(
            validate_identity_check_selection(Some(&persona), &[], [MNC_ISSUER_SCHEMA_ID]),
            Err(SidecarError::CredentialUnavailable)
        ));
    }
}
