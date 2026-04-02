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
    /// An error from the authenticator (network, proof generation, etc.).
    Authenticator(AuthenticatorError),
    /// Internal error.
    Internal(String),
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
            Self::IdentityNotFound => write!(f, "identity not found"),
            Self::Authenticator(e) => write!(f, "authenticator error: {e}"),
            Self::Internal(msg) => write!(f, "internal error: {msg}"),
        }
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
                Json(serde_json::json!({"error": "identity not found"})),
            )
                .into_response(),
            SidecarError::Authenticator(e) => {
                tracing::error!("Authenticator error: {e}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": e.to_string()})),
                )
                    .into_response()
            }
            SidecarError::Internal(msg) => {
                tracing::error!("Internal error: {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": msg})),
                )
                    .into_response()
            }
        }
    }
}
