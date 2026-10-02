use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleManifest {
    pub module_id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub min_core_version: String,
    pub min_app_version: String,
    #[serde(default)]
    pub required_permissions: Vec<String>,
    #[serde(default)]
    pub provided_commands: Vec<String>,
    #[serde(default)]
    pub provided_events: Vec<String>,
    #[serde(default)]
    pub provided_queries: Vec<String>,
    #[serde(default)]
    pub capabilities: Vec<String>,
    pub binary_format: String,
    pub binary_size_bytes: u64,
    pub sha256: String,
    pub signed_by: String,
    pub signed_at: String,
}

impl ModuleManifest {
    pub fn parse(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Structural validation only. Cryptographic verification is performed
    /// by the Cloud at publish time and re-verified at install time
    /// (see `modules::verify` and `modules::installer`).
    pub fn validate(&self) -> Result<(), String> {
        if self.module_id.is_empty() {
            return Err("module_id is empty".into());
        }
        if self.version.is_empty() {
            return Err("version is empty".into());
        }
        if self.sha256.len() != 64 {
            return Err(format!(
                "sha256 must be 64 hex chars, got {}",
                self.sha256.len()
            ));
        }
        if self.binary_format != "wasm32-wasip2" && self.binary_format != "wasm" {
            return Err(format!(
                "unsupported binary_format: {}",
                self.binary_format
            ));
        }
        Ok(())
    }
}