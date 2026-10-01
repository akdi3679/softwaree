# TASK ID: ADMIN-008.4
# TITLE: Add module installer (download, verify, install)
# STATUS: pending
# DEPENDENCIES: ADMIN-008.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/modules/installer.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the module installer — downloads from Cloud, verifies triple-signature, stores on disk.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/modules/installer.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use sha2::{Digest, Sha256};
use serde::Deserialize;
use sqlx::SqlitePool;
use std::path::Path;

use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};
use crate::modules::manifest::ModuleManifest;
use crate::modules::verify::{self, ModuleSignature};

#[derive(Debug, Deserialize)]
struct PackageResponse {
    manifest: serde_json::Value,
    binary: String, // base64
    signatures: ModuleSignature,
}

pub async fn install(
    pool: &SqlitePool,
    device_key: &DeviceKey,
    modules_dir: &Path,
    module_id: &str,
    version: &str,
    project_id: &str,
    plan_id: &str,
    cloud_client: &crate::cloud::CloudClient,
) -> AppResult<String> {
    // 1. Call Cloud to get the signed package
    let url = format!("https://cloud.product.local/v1/modules/{}/versions/{}/package", module_id, version);
    let response: PackageResponse = cloud_client
        .post(&url, &serde_json::json!({
            "projectId": project_id,
            "planId": plan_id,
            "deviceId": device_key.public_key_b64(),
            "deviceBindKey": hex::encode(device_key.sign_bytes()),
        }))
        .await?;

    // 2. Decode the binary and verify SHA-256
    let binary = B64.decode(&response.binary)
        .map_err(|e| AppError::Module(format!("base64 decode: {e}")))?;
    let mut hasher = Sha256::new();
    hasher.update(&binary);
    let binary_sha256 = hex::encode(hasher.finalize());

    // 3. Parse the manifest
    let manifest: ModuleManifest = serde_json::from_value(response.manifest.clone())?;
    manifest.validate().map_err(AppError::Module)?;
    if manifest.sha256 != binary_sha256 {
        return Err(AppError::Module("SHA-256 mismatch".into()));
    }

    // 4. Verify triple signature
    let manifest_json = serde_json::to_string(&response.manifest)?;
    verify::verify_triple(
        &manifest_json,
        &binary_sha256,
        &response.signatures,
        project_id,
        device_key,
    )?;

    // 5. Write binary to disk
    let dest = modules_dir.join(format!("{}-{}.wasm", module_id, version));
    tokio::fs::write(&dest, &binary).await?;

    // 6. Register in DB
    let entry_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO module_registry (id, module_id, name, version, state, installed_at, installed_by_user_id, installed_by_device_id, binary_path, schema_version)
        VALUES (?, ?, ?, ?, 'installed', ?, ?, ?, ?, 1)
        ON CONFLICT (module_id, version) DO UPDATE SET state = 'installed'
        "#,
    )
    .bind(&entry_id)
    .bind(&manifest.module_id)
    .bind(&manifest.name)
    .bind(&manifest.version)
    .bind(&now)
    .bind("system") // TODO: actor user
    .bind(device_key.public_key_b64())
    .bind(dest.to_string_lossy().to_string())
    .execute(pool)
    .await?;

    Ok(manifest.module_id.clone())
}
```

Note: the `module_registry` table needs to be added in a migration. Add it via `migrations/003_modules.sql`:

```sql
CREATE TABLE module_registry (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'discovered',
    installed_at TEXT,
    installed_by_user_id TEXT,
    installed_by_device_id TEXT,
    binary_path TEXT NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    license_expires_at TEXT,
    last_verified_at TEXT,
    UNIQUE(module_id, version)
);
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/modules/installer.rs || { echo "FAIL"; exit 1; }
grep -q "fn install" apps/admin/src-tauri/src/modules/installer.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/migrations/003_modules.sql || { echo "FAIL: no 003 migration"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
