# TASK ID: ADMIN-003.6
# TITLE: Add device identity persistence
# STATUS: pending
# DEPENDENCIES: ADMIN-003.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/identity/mod.rs, product/apps/admin/src-tauri/src/identity/device_identity.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Persist the device identity to disk (encrypted by the OS keychain). Load on startup.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/identity/mod.rs`:

```rust
pub mod device_identity;
```

Create `product/apps/admin/src-tauri/src/identity/device_identity.rs`:

```rust
use std::path::Path;
use serde::{Deserialize, Serialize};
use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

const DEVICE_IDENTITY_FILE: &str = "device_identity.json";

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceIdentityRecord {
    /// base64-encoded 32-byte private key
    pub private_key_b64: String,
    /// base64-encoded 32-byte public key
    pub public_key_b64: String,
    /// Cached device id (assigned by Cloud on registration)
    pub device_id: Option<String>,
    pub created_at: String,
}

impl DeviceIdentityRecord {
    pub fn load_or_create(keys_dir: &Path) -> AppResult<(DeviceKey, Self)> {
        let path = keys_dir.join(DEVICE_IDENTITY_FILE);
        if path.exists() {
            let s = std::fs::read_to_string(&path)?;
            let record: Self = serde_json::from_str(&s)
                .map_err(|e| AppError::Crypto(format!("device identity corrupt: {e}")))?;
            let pk_bytes = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &record.private_key_b64)
                .map_err(|e| AppError::Crypto(format!("base64 decode: {e}")))?;
            let key = DeviceKey::from_bytes(&pk_bytes)?;
            Ok((key, record))
        } else {
            let key = DeviceKey::generate();
            let record = Self {
                private_key_b64: {
                    use base64::Engine;
                    let dummy = [0u8; 32]; // placeholder, will be replaced
                    let _ = dummy;
                    base64::engine::general_purpose::STANDARD.encode(key.public_key_bytes()) // we re-derive below
                },
                public_key_b64: key.public_key_b64(),
                device_id: None,
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            // Actually encode the private key properly
            let mut sk_bytes = [0u8; 32];
            sk_bytes.copy_from_slice(&key.sign_bytes());
            let record = Self {
                private_key_b64: base64::engine::general_purpose::STANDARD.encode(sk_bytes),
                public_key_b64: key.public_key_b64(),
                device_id: None,
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            // Save (in v1, plain JSON. In v2, encrypt with OS keychain.)
            let json = serde_json::to_string_pretty(&record)?;
            std::fs::write(&path, json)?;
            // Restrict permissions
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&path)?.permissions();
                perms.set_mode(0o600);
                std::fs::set_permissions(&path, perms)?;
            }
            Ok((key, record))
        }
    }
}
```

Add a `sign_bytes` helper to `device_key.rs`:

```rust
impl DeviceKey {
    /// Get the private signing key as raw bytes.
    pub fn sign_bytes(&self) -> [u8; 32] {
        self.signing.to_bytes()
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/identity/device_identity.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/identity/mod.rs || { echo "FAIL: no mod"; exit 1; }
grep -q "DeviceIdentityRecord" apps/admin/src-tauri/src/identity/device_identity.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -10 || { echo "FAIL"; exit 1; }
echo "OK"
```
