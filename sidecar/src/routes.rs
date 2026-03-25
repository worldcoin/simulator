use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::State;
use axum::middleware;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use world_id_core::primitives::{
    Credential, FieldElement, ProofRequest, ProofResponse, RequestVersion,
};
use world_id_core::Authenticator;

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

async fn list_identities(
    State(state): State<Arc<AppState>>,
) -> Json<Vec<IdentityInfo>> {
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

    let proof_request: ProofRequest = serde_json::from_value(req.proof_request)
        .map_err(|e| SidecarError::Internal(format!("invalid proof_request: {e}")))?;

    // Check which credentials satisfy the request constraints
    let available: HashSet<u64> = identity
        .credentials
        .iter()
        .map(|c| c.issuer_schema_id)
        .collect();

    let items_to_prove = proof_request
        .credentials_to_prove(&available)
        .ok_or(SidecarError::CredentialUnavailable)?;

    // Fetch inclusion proof and authenticator public key set from indexer
    let (inclusion_proof, key_set) = identity
        .authenticator
        .fetch_inclusion_proof()
        .await
        .map_err(SidecarError::from)?;

    // Generate OPRF nullifier (required for all proofs)
    let oprf_output = identity
        .authenticator
        .generate_nullifier(&proof_request, inclusion_proof, key_set)
        .await
        .map_err(SidecarError::from)?;

    // For session proofs, generate session ID
    let (session_id, session_id_r_seed) = if is_session {
        let (sid, seed) = identity
            .authenticator
            .generate_session_id(&proof_request, None)
            .await
            .map_err(SidecarError::from)?;
        (Some(sid), seed)
    } else {
        let seed = FieldElement::random(&mut rand::rngs::OsRng);
        (None, seed)
    };

    // Generate proof for each credential that satisfies the request
    let mut responses = Vec::new();
    for (i, item) in items_to_prove.iter().enumerate() {
        let credential = identity
            .credentials
            .iter()
            .find(|c| c.issuer_schema_id == item.issuer_schema_id)
            .ok_or(SidecarError::CredentialUnavailable)?;

        // Generate credential blinding factor via OPRF
        let blinding_factor = identity
            .authenticator
            .generate_credential_blinding_factor(item.issuer_schema_id)
            .await
            .map_err(SidecarError::from)?;

        // For the first item we consume oprf_output, for subsequent items we'd need Clone.
        // Currently the protocol typically requests a single credential, so this covers
        // the common case. Multi-credential support requires FullOprfOutput to impl Clone.
        if i > 0 {
            return Err(SidecarError::Internal(
                "multi-credential proofs not yet supported in sidecar".to_string(),
            ));
        }

        let response_item = identity
            .authenticator
            .generate_single_proof(
                oprf_output,
                item,
                credential,
                blinding_factor,
                session_id_r_seed,
                session_id,
                proof_request.created_at,
            )
            .map_err(SidecarError::from)?;

        responses.push(response_item);
        break; // consumed oprf_output by value
    }

    Ok(Json(ProofResponse {
        id: proof_request.id.clone(),
        version: proof_request.version,
        session_id,
        error: None,
        responses,
    }))
}
