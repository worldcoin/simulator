use serde::Deserialize;
use world_id_core::primitives::{Config, Credential};

/// Top-level sidecar configuration loaded from JSON.
#[derive(Debug, Deserialize)]
pub struct SidecarConfig {
    /// Protocol configuration (chain_id, indexer_url, gateway_url, nullifier_oracle_urls, etc.)
    /// This is deserialized directly into the protocol's `Config` type.
    pub protocol: Config,
    /// Pre-configured identities with seeds and credentials.
    pub identities: Vec<IdentityConfig>,
}

/// A single pre-configured identity.
#[derive(Debug, Deserialize)]
pub struct IdentityConfig {
    /// Hex-encoded 32-byte seed (with or without 0x prefix).
    pub seed: String,
    /// Pre-issued credentials for this identity.
    pub credentials: Vec<Credential>,
}

impl SidecarConfig {
    /// Load configuration from a JSON file.
    pub fn load(path: &str) -> eyre::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: Self = serde_json::from_str(&content)?;
        Ok(config)
    }
}

impl IdentityConfig {
    /// Decode the hex seed into bytes.
    pub fn seed_bytes(&self) -> eyre::Result<Vec<u8>> {
        let seed = self.seed.strip_prefix("0x").unwrap_or(&self.seed);
        hex::decode(seed).map_err(|e| eyre::eyre!("invalid hex seed: {e}"))
    }
}
