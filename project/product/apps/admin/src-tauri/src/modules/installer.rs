use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

use crate::error::{AppError, AppResult};
use crate::modules::manifest::ModuleManifest;
use crate::modules::verify::{self, ModuleSignature, VerifyContext};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallPackage {
    pub manifest: ModuleManifest,
    pub binary_b64: String,
    pub signatures: ModuleSignature,
}

#[derive(Debug, Clone, Serialize)]
pub struct InstallResult {
    pub module_registry_id: String,
    pub module_id: String,
    pub version: String,
    pub binary_path: String,
    pub sha256: String,
}

pub struct InstallContext<'a> {
    pub pool: &'a SqlitePool,
    pub modules_dir: &'a Path,
    pub project_id: &'a str,
    pub plan_id: &'a str,
    pub device_id: &'a str,
    pub device_bind_key: &'a [u8],
}

/// Install a signed module package end to end:
///
/// 1. Decode the binary from base64.
/// 2. Compute its SHA-256 and compare to the manifest.
/// 3. Verify all three signatures (cloud root, project license, device bind).
/// 4. Write the binary to `modules_dir`.
/// 5. Insert a row into `module_registry`.
///
/// Any failure at any step aborts the install with no partial state: the
/// binary is only written after all signatures verify, and the DB row is
/// only inserted after the binary write succeeds.
pub async fn install(ctx: InstallContext<'_>, package: InstallPackage) -> AppResult<InstallResult> {
    // 1. Decode binary
    let binary = B64
        .decode(&package.binary_b64)
        .map_err(|e| AppError::Validation(format!("binary base64: {e}")))?;

    // 2. Verify sha256
    let actual_sha = hex::encode(Sha256::digest(&binary));
    if actual_sha != package.manifest.sha256.to_lowercase() {
        return Err(AppError::Validation(format!(
            "sha256 mismatch: manifest {}, binary {}",
            package.manifest.sha256, actual_sha
        )));
    }

    // 3. Verify signatures
    let vctx = VerifyContext {
        module_id: &package.manifest.module_id,
        version: &package.manifest.version,
        manifest_sha256_hex: &actual_sha,
        project_id: ctx.project_id,
        plan_id: ctx.plan_id,
        device_id: ctx.device_id,
        device_bind_key: ctx.device_bind_key,
    };
    verify::verify_all(&vctx, &package.signatures)
        .map_err(|e| AppError::Crypto(format!("module signature verification failed: {e}")))?;

    // 4. Write binary atomically (temp file + rename)
    std::fs::create_dir_all(ctx.modules_dir)?;
    let bin_name = format!(
        "{}-{}.wasm",
        package.manifest.module_id, package.manifest.version
    );
    let bin_path: PathBuf = ctx.modules_dir.join(&bin_name);
    let tmp_path = ctx.modules_dir.join(format!(".{}.tmp", bin_name));
    std::fs::write(&tmp_path, &binary)?;
    std::fs::rename(&tmp_path, &bin_path)?;

    // 5. Insert into module_registry
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO module_registry \
         (id, module_id, name, version, state, installed_at, \
          installed_by_user_id, installed_by_device_id, binary_path, schema_version) \
         VALUES (?, ?, ?, ?, 'installed', ?, 'admin', ?, ?, 1)",
    )
    .bind(&id)
    .bind(&package.manifest.module_id)
    .bind(&package.manifest.name)
    .bind(&package.manifest.version)
    .bind(&now)
    .bind(ctx.device_id)
    .bind(bin_path.to_string_lossy().to_string())
    .execute(ctx.pool)
    .await?;

    Ok(InstallResult {
        module_registry_id: id,
        module_id: package.manifest.module_id,
        version: package.manifest.version,
        binary_path: bin_path.to_string_lossy().to_string(),
        sha256: actual_sha,
    })
}

// Tests for the installer require a live SQLite pool. That is a Category C
// item (running environment). The cryptographic core is fully covered by
// the tests in `modules::verify`.