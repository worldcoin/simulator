use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;

/// Middleware that validates `Authorization: Bearer <token>` against `BEARER_TOKEN` env var.
pub async fn bearer_auth(req: Request, next: Next) -> Response {
    let expected = match std::env::var("BEARER_TOKEN") {
        Ok(t) if !t.is_empty() => t,
        // If no token is configured, reject everything.
        _ => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "server misconfigured: no BEARER_TOKEN set"})),
            )
                .into_response();
        }
    };

    let auth_header = req
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok());

    match auth_header {
        Some(header)
            if header
                .strip_prefix("Bearer ")
                .is_some_and(|t| t == expected) =>
        {
            next.run(req).await
        }
        _ => (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "unauthorized"})),
        )
            .into_response(),
    }
}
