use std::sync::Arc;

mod auth;
mod config;
mod error;
mod routes;

use config::SidecarConfig;
use routes::{AppState, IdentityState};

#[tokio::main]
async fn main() -> eyre::Result<()> {
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("failed to install rustls crypto provider");

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "identities.json".into());
    tracing::info!("Loading config from {config_path}");
    let sidecar_config = SidecarConfig::load(&config_path)?;

    // Load proof materials once (shared across all identities).
    // These are the Groth16 circuit keys embedded in the binary via compress-zkeys.
    tracing::info!("Loading proof materials (this may take a moment)...");
    let query_material = Arc::new(world_id_core::proof::load_embedded_query_material()?);
    let nullifier_material = Arc::new(world_id_core::proof::load_embedded_nullifier_material()?);
    tracing::info!("Proof materials loaded");

    // Initialize an Authenticator for each pre-configured identity.
    let mut identities = Vec::new();
    for (i, identity_config) in sidecar_config.identities.iter().enumerate() {
        let seed = identity_config.seed_bytes()?;
        let protocol_config = sidecar_config.protocol.clone();

        tracing::info!("Initializing identity {i}...");
        let authenticator =
            world_id_core::Authenticator::init(&seed, protocol_config)
                .await
                .map_err(|e| eyre::eyre!("failed to init identity {i}: {e}"))?
                .with_proof_materials(query_material.clone(), nullifier_material.clone());

        tracing::info!(
            "Identity {i} initialized (leaf_index={})",
            authenticator.leaf_index()
        );

        identities.push(IdentityState {
            authenticator,
            credentials: identity_config.credentials.clone(),
        });
    }

    let state = Arc::new(AppState { identities });
    let app = routes::router(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await?;
    tracing::info!("Sidecar listening on 0.0.0.0:{port}");
    axum::serve(listener, app).await?;

    Ok(())
}
