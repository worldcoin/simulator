use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::State;
use axum::middleware;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use world_id_core::requests::{ProofRequest, ProofResponse};
use world_id_core::{Authenticator, Credential, CredentialInput};

use crate::auth::bearer_auth;
use crate::error::SidecarError;

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
        .map_err(|e| SidecarError::Internal(format!("invalid proof_request: {e}")))?;

    if is_session != proof_request.is_session_proof() {
        return Err(SidecarError::Internal(
            "proof request type did not match endpoint".to_string(),
        ));
    }

    // Check which credentials satisfy the request constraints
    let available: HashSet<u64> = identity
        .credentials
        .iter()
        .map(|c| c.issuer_schema_id)
        .collect();

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
