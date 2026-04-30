use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
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

/// Extract a stable, snake_case error code from an `AuthenticatorError`.
///
/// `AuthenticatorError::ProofError(ProofError::RequestAuthError(WorldIdRequestAuthError))`
/// chains transparent variants whose Display impl emits exactly the snake_case identifier
/// (e.g. `invalid_rp_signature`, `rp_signature_expired`). We can't downcast to those types
/// without taking a direct dep on world-id-proof, but `transparent` forwards Display, so the
/// AuthenticatorError's own `to_string()` is already the code in those cases. Treat any
/// display string that looks like a bare snake_case identifier as the code; otherwise
/// fall back to a generic.
fn authenticator_error_code(err: &AuthenticatorError) -> String {
    let display = err.to_string();
    let is_snake_case_code = !display.is_empty()
        && display.len() <= 64
        && display
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_');
    if is_snake_case_code {
        display
    } else {
        "proof_generation_failed".to_string()
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
