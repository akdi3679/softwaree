# TASK ID: ADMIN-008.2
# TITLE: Add module manifest parser
# STATUS: pending
# DEPENDENCIES: ADMIN-008.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/modules/manifest.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Parse and validate a module's manifest.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/modules/manifest.rs`:

```rust
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

    /// Validate the manifest. Returns Err if anything's wrong.
    pub fn validate(&self) -> Result<(), String> {
        if !self.module_id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_') {
            return Err("module_id must be lowercase alphanumeric + dash/underscore".into());
        }
        if !is_semver(&self.version) {
            return Err("version must be semver (e.g., 1.0.0)".into());
        }
        if self.binary_format != "wasm32-wasip2" {
            return Err(format!("unsupported binary format: {}", self.binary_format));
        }
        if self.sha256.len() != 64 {
            return Err("sha256 must be 64 hex chars".into());
        }
        Ok(())
    }
}

fn is_semver(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| p.parse::<u32>().is_ok())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/modules/manifest.rs || { echo "FAIL"; exit 1; }
grep -q "fn validate" apps/admin/src-tauri/src/modules/manifest.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -3 || { echo "FAIL"; exit 1; }
echo "OK"
```
