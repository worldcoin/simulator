use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::State;
use axum::middleware;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use world_id_core::primitives::{
    FieldElement, Nullifier, SessionId, SessionNullifier, ZeroKnowledgeProof,
};
use world_id_core::requests::{ProofRequest, ProofResponse, ResponseItem};
use world_id_core::{Authenticator, Credential, CredentialInput};

use crate::auth::bearer_auth;
use crate::error::SidecarError;

const PASSPORT_ISSUER_SCHEMA_ID: u64 = 9303;

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
) -> Result<Json<ProofResponse>, SidecarError> {
    generate_proof_inner(&state, req, false).await
}

async fn generate_session_proof(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ProofRequestBody>,
) -> Result<Json<ProofResponse>, SidecarError> {
    generate_proof_inner(&state, req, true).await
}

/// Core proof generation logic shared between uniqueness and session proofs.
async fn generate_proof_inner(
    state: &AppState,
    req: ProofRequestBody,
    is_session: bool,
) -> Result<Json<ProofResponse>, SidecarError> {
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

    let available: HashSet<u64> = identity
        .credentials
        .iter()
        .map(|c| c.issuer_schema_id)
        .collect();

    if let Some(response) = fake_passport_response(&proof_request, &available) {
        tracing::warn!(
            request_id = %proof_request.id,
            "returning fake passport proof response"
        );
        return Ok(Json(response));
    }

    // Check which credentials satisfy the request constraints
    let items_to_prove = proof_request
        .credentials_to_prove(&available)
        .ok_or(SidecarError::CredentialUnavailable)?;

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

    Ok(Json(result.proof_response))
}

fn fake_passport_response(
    proof_request: &ProofRequest,
    available: &HashSet<u64>,
) -> Option<ProofResponse> {
    let mut available_with_passport = available.clone();
    available_with_passport.insert(PASSPORT_ISSUER_SCHEMA_ID);

    let items_to_prove = proof_request.credentials_to_prove(&available_with_passport)?;
    if !items_to_prove
        .iter()
        .any(|item| item.issuer_schema_id == PASSPORT_ISSUER_SCHEMA_ID)
    {
        return None;
    }

    let responses = items_to_prove
        .into_iter()
        .map(|item| {
            let expires_at_min = item.effective_expires_at_min(proof_request.created_at);
            if proof_request.is_session_proof() {
                ResponseItem::new_session(
                    item.identifier.clone(),
                    item.issuer_schema_id,
                    ZeroKnowledgeProof::default(),
                    SessionNullifier::default(),
                    expires_at_min,
                )
            } else {
                ResponseItem::new_uniqueness(
                    item.identifier.clone(),
                    item.issuer_schema_id,
                    ZeroKnowledgeProof::default(),
                    fake_nullifier(
                        proof_request,
                        item.identifier.as_str(),
                        item.issuer_schema_id,
                    ),
                    expires_at_min,
                )
            }
        })
        .collect();

    let session_id = if proof_request.is_create_session() {
        Some(SessionId::default())
    } else {
        proof_request.session_id
    };

    Some(ProofResponse {
        id: proof_request.id.clone(),
        version: proof_request.version,
        session_id,
        error: None,
        responses,
    })
}

fn fake_nullifier(
    proof_request: &ProofRequest,
    identifier: &str,
    issuer_schema_id: u64,
) -> Nullifier {
    let seed = format!(
        "simulator-fake-passport:{}:{}:{}",
        proof_request.id, identifier, issuer_schema_id
    );
    Nullifier::new(FieldElement::from_arbitrary_raw_bytes(seed.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn proof_request_json(requests: serde_json::Value) -> serde_json::Value {
        let zero_field = "0x0000000000000000000000000000000000000000000000000000000000000000";

        serde_json::json!({
            "id": "req_passport",
            "version": 1,
            "created_at": 1_735_689_600_u64,
            "expires_at": 1_767_225_600_u64,
            "rp_id": "rp_0000000000000001",
            "oprf_key_id": 1,
            "action": zero_field,
            "signature": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b",
            "nonce": zero_field,
            "proof_requests": requests
        })
    }

    #[test]
    fn builds_fake_passport_response_for_schema_9303() {
        let proof_request = ProofRequest::from_json(
            &proof_request_json(serde_json::json!([
                {
                    "identifier": "passport",
                    "issuer_schema_id": 9303,
                    "genesis_issued_at_min": null,
                    "expires_at_min": 1_735_689_600_u64
                }
            ]))
            .to_string(),
        )
        .unwrap();
        let available = HashSet::new();

        let response = fake_passport_response(&proof_request, &available).unwrap();

        assert_eq!(response.id, "req_passport");
        assert_eq!(response.responses.len(), 1);
        assert_eq!(response.responses[0].identifier, "passport");
        assert_eq!(response.responses[0].issuer_schema_id, 9303);
        assert!(response.responses[0].nullifier.is_some());
        assert!(response.responses[0].session_nullifier.is_none());
        assert_ne!(
            response.responses[0].nullifier,
            Some(Nullifier::new(FieldElement::ZERO))
        );
        proof_request.validate_response(&response).unwrap();
    }

    #[test]
    fn does_not_fake_non_passport_requests() {
        let proof_request = ProofRequest::from_json(
            &proof_request_json(serde_json::json!([
                {
                    "identifier": "document",
                    "issuer_schema_id": 128,
                    "genesis_issued_at_min": null,
                    "expires_at_min": 1_735_689_600_u64
                }
            ]))
            .to_string(),
        )
        .unwrap();
        let available = HashSet::new();

        assert!(fake_passport_response(&proof_request, &available).is_none());
    }
}
