use serde::Deserialize;
use serde_json::{Map, Value};
use world_id_core::primitives::{Config, Credential};

/// Top-level sidecar configuration loaded from JSON.
#[derive(Debug, Deserialize)]
pub struct SidecarConfig {
    /// Protocol configuration (chain_id, indexer_url, gateway_url, nullifier_oracle_urls, etc.)
    /// This is deserialized directly into the protocol's `Config` type.
    #[serde(deserialize_with = "deserialize_protocol_config")]
    pub protocol: Config,
    /// Pre-configured identities with seeds and credentials.
    pub identities: Vec<IdentityConfig>,
}

fn deserialize_protocol_config<'de, D>(deserializer: D) -> Result<Config, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let mut value = Value::deserialize(deserializer)?;
    if let Ok(config) = Config::deserialize(value.clone()) {
        return Ok(config);
    }

    normalize_legacy_service_endpoint(&mut value, "indexer_url", "indexer")
        .map_err(serde::de::Error::custom)?;
    normalize_legacy_service_endpoint(&mut value, "gateway_url", "gateway")
        .map_err(serde::de::Error::custom)?;

    Config::deserialize(value).map_err(serde::de::Error::custom)
}

fn normalize_legacy_service_endpoint(
    value: &mut Value,
    legacy_key: &str,
    endpoint_key: &str,
) -> Result<(), String> {
    let object = value
        .as_object_mut()
        .ok_or_else(|| "protocol config must be a JSON object".to_string())?;

    if object.contains_key(endpoint_key) {
        return Ok(());
    }

    let url = object
        .remove(legacy_key)
        .ok_or_else(|| format!("missing field `{endpoint_key}`"))?;

    let url = url
        .as_str()
        .ok_or_else(|| format!("field `{legacy_key}` must be a string"))?
        .to_string();

    let mut endpoint = Map::new();
    endpoint.insert("type".to_string(), Value::String("direct".to_string()));
    endpoint.insert("url".to_string(), Value::String(url));
    object.insert(endpoint_key.to_string(), Value::Object(endpoint));

    Ok(())
}

/// A single pre-configured identity.
#[derive(Debug, Deserialize)]
pub struct IdentityConfig {
    /// Hex-encoded 32-byte seed (with or without 0x prefix).
    pub seed: String,
    /// Pre-issued credentials for this identity.
    pub credentials: Vec<Credential>,
}

#[cfg(test)]
mod tests {
    use super::SidecarConfig;

    #[test]
    fn loads_legacy_protocol_urls() {
        let config: SidecarConfig = serde_json::from_str(
            r#"{
              "protocol": {
                "chain_id": 480,
                "registry_address": "0x8556d07D75025f286fe757C7EeEceC40D54FA16D",
                "indexer_url": "https://indexer.example.com",
                "gateway_url": "https://gateway.example.com",
                "nullifier_oracle_urls": ["https://node0.example.com"],
                "nullifier_oracle_threshold": 1
              },
              "identities": []
            }"#,
        )
        .expect("legacy config should parse");

        assert_eq!(config.protocol.indexer_url(), "https://indexer.example.com");
        assert_eq!(config.protocol.gateway_url(), "https://gateway.example.com");
    }

    #[test]
    fn loads_current_protocol_endpoints() {
        let config: SidecarConfig = serde_json::from_str(
            r#"{
              "protocol": {
                "chain_id": 480,
                "registry_address": "0x8556d07D75025f286fe757C7EeEceC40D54FA16D",
                "indexer": { "type": "direct", "url": "https://indexer.example.com" },
                "gateway": { "type": "direct", "url": "https://gateway.example.com" },
                "nullifier_oracle_urls": ["https://node0.example.com"],
                "nullifier_oracle_threshold": 1
              },
              "identities": []
            }"#,
        )
        .expect("current config should parse");

        assert_eq!(config.protocol.indexer_url(), "https://indexer.example.com");
        assert_eq!(config.protocol.gateway_url(), "https://gateway.example.com");
    }
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
