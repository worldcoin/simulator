use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use world_id_core::primitives::oprf::WorldIdRequestAuthError;
use world_id_core::AuthenticatorError;

/// Sidecar error type that converts into HTTP responses.
pub enum SidecarError {
    /// The user's credentials do not satisfy the proof request constraints.
    CredentialUnavailable,
    /// The requested identity index does not exist.
    IdentityNotFound,
    /// The request body or proof_request itself is malformed.
    BadRequest(String),
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
            Self::Authenticator(e) => write!(f, "authenticator error: {e}"),
        }
    }
}

/// Walk the error source chain looking for a `WorldIdRequestAuthError` and return its
/// snake_case code (e.g. `invalid_rp_signature`). Falls back to `proof_generation_failed`.
fn authenticator_error_code(err: &AuthenticatorError) -> String {
    use std::error::Error;
    let mut current: Option<&dyn Error> = Some(err);
    while let Some(e) = current {
        if let Some(req_auth) = e.downcast_ref::<WorldIdRequestAuthError>() {
            return req_auth.to_string();
        }
        current = e.source();
    }
    "proof_generation_failed".to_string()
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
