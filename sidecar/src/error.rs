use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use world_id_core::AuthenticatorError;
use world_id_proof::ProofError;

/// Sidecar error type that converts into HTTP responses.
#[derive(Debug)]
pub enum SidecarError {
    /// The user's credentials do not satisfy the proof request constraints.
    CredentialUnavailable,
    /// The requested identity index does not exist.
    IdentityNotFound,
    /// The request body or proof_request itself is malformed.
    BadRequest(String),
    /// The selected identity has a document credential, but requested attributes do not match.
    IdentityAttributesNotMatched,
    /// An error from the authenticator (network, proof generation, etc.).
    Authenticator(AuthenticatorError),
}

impl From<AuthenticatorError> for SidecarError {
    fn from(e: AuthenticatorError) -> Self {
        Self::Authenticator(e)
    }
}

impl std::fmt::Display for SidecarError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::CredentialUnavailable => write!(f, "credential_unavailable"),
            Self::IdentityNotFound => write!(f, "identity_not_found"),
            Self::BadRequest(msg) => write!(f, "bad request: {msg}"),
            Self::IdentityAttributesNotMatched => write!(f, "identity_attributes_not_matched"),
            Self::Authenticator(e) => write!(f, "authenticator error: {e}"),
        }
    }
}

/// Extract a stable, snake_case error code from an `AuthenticatorError`.
///
/// Request-level failures bubble up as
/// `AuthenticatorError::ProofError(ProofError::RequestAuthError(WorldIdRequestAuthError))`,
/// whose Display is the snake_case identifier (e.g. `invalid_rp_signature`).
fn authenticator_error_code(err: &AuthenticatorError) -> String {
    match err {
        AuthenticatorError::ProofError(ProofError::RequestAuthError(req_auth)) => {
            req_auth.to_string()
        }
        _ => "proof_generation_failed".to_string(),
    }
}

impl IntoResponse for SidecarError {
    fn into_response(self) -> Response {
        match self {
            SidecarError::CredentialUnavailable => (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error_code": "credential_unavailable"})),
            )
                .into_response(),
            SidecarError::IdentityNotFound => (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({"error_code": "identity_not_found"})),
            )
                .into_response(),
            SidecarError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error_code": "bad_request", "error": msg})),
            )
                .into_response(),
            SidecarError::IdentityAttributesNotMatched => (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error_code": "identity_attributes_not_matched"})),
            )
                .into_response(),
            SidecarError::Authenticator(e) => {
                let code = authenticator_error_code(&e);
                tracing::warn!(error_code = %code, "Authenticator error: {e}");
                (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({"error_code": code, "error": e.to_string()})),
                )
                    .into_response()
            }
        }
    }
}
