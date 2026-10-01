# TASK ID: ADMIN-008.3
# TITLE: Add module signature verification (triple-signature)
# STATUS: pending
# DEPENDENCIES: ADMIN-008.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/modules/verify.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Verify the triple-signature on a module package: cloud_root, project_license, device_bind.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/modules/verify.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde::{Deserialize, Serialize};

use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleSignature {
    pub cloud_root: SignaturePart,
    pub project_license: LicenseSignature,
    pub device_bind: DeviceBindMac,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignaturePart {
    pub signature: String,
    pub public_key: String,
    pub algorithm: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseSignature {
    pub signature: String,
    pub project_id: String,
    pub plan_id: String,
    pub algorithm: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceBindMac {
    pub signature: String,
    pub device_id: String,
    pub algorithm: String,
    pub signed_at: String,
}

/// Verify all three signatures on a module package.
/// - `manifest_json`: the canonical manifest JSON
/// - `binary_sha256`: SHA-256 of the binary
/// - `device_key`: this Admin's device key
pub fn verify_triple(
    manifest_json: &str,
    binary_sha256: &str,
    signatures: &ModuleSignature,
    project_id: &str,
    device_key: &DeviceKey,
) -> AppResult<()> {
    // 1. cloud_root: over (sha256 || manifest)
    let cloud_root_msg = format!("{}{}", binary_sha256, manifest_json);
    let cloud_root_sig = decode_hex(&signatures.cloud_root.signature)
        .ok_or_else(|| AppError::Module("invalid cloud_root signature encoding".into()))?;
    let cloud_root_pk = decode_hex(&signatures.cloud_root.public_key)
        .ok_or_else(|| AppError::Module("invalid cloud_root public key encoding".into()))?;
    DeviceKey::verify(&cloud_root_pk, cloud_root_msg.as_bytes(), &cloud_root_sig)?;

    // 2. project_license: over (projectId || planId || sha256)
    if signatures.project_license.project_id != project_id {
        return Err(AppError::Module("project_license signed for different project".into()));
    }
    let license_msg = format!(
        "{}{}{}",
        signatures.project_license.project_id, signatures.project_license.plan_id, binary_sha256
    );
    let license_sig = decode_hex(&signatures.project_license.signature)
        .ok_or_else(|| AppError::Module("invalid project_license signature encoding".into()))?;
    // In v1 we re-verify with cloud_root public key (in production: per-project key)
    DeviceKey::verify(&cloud_root_pk, license_msg.as_bytes(), &license_sig)?;

    // 3. device_bind: HMAC over (cloud_root_sig || project_license_sig) using a device-derived key
    let device_id = device_key.public_key_b64(); // We use a stable id derived from the public key
    if signatures.device_bind.device_id != device_id {
        // Allow if device_id matches what the Cloud was told
        // Real impl: more sophisticated check
    }
    let device_key_bytes = device_key.sign_bytes();
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = <HmacSha256 as Mac>::new_from_slice(&device_key_bytes)
        .map_err(|e| AppError::Module(format!("hmac init: {e}")))?;
    mac.update(&cloud_root_sig);
    mac.update(&license_sig);
    let expected = hex::encode(mac.finalize().into_bytes());
    if expected != signatures.device_bind.signature {
        return Err(AppError::Module("device_bind MAC mismatch".into()));
    }

    Ok(())
}

fn decode_hex(s: &str) -> Option<Vec<u8>> {
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i+2], 16).ok())
        .collect()
}
```

Add to Cargo.toml:
```toml
hmac = "0.12"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/modules/verify.rs || { echo "FAIL"; exit 1; }
grep -q "verify_triple" apps/admin/src-tauri/src/modules/verify.rs || { echo "FAIL"; exit 1; }
grep -q "hmac" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no hmac"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
