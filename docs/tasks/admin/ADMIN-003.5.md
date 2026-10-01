# TASK ID: ADMIN-003.5
# TITLE: Add KDF module for deriving keys from device key
# STATUS: pending
# DEPENDENCIES: ADMIN-003.4
# ALLOWED FILES: product/apps/admin/src-tauri/src/crypto/kdf.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add HKDF-based key derivation. The Admin's device key derives encryption keys for projects, modules, etc.

## REQUIRED IMPLEMENTATION

Add to `product/apps/admin/src-tauri/Cargo.toml` dependencies:

```toml
hkdf = "0.12"
sha2 = "0.10"
```

Replace `product/apps/admin/src-tauri/src/crypto/kdf.rs`:

```rust
use hkdf::Hkdf;
use sha2::Sha256;
use crate::error::AppError;

/// HKDF info strings (domain separation).
pub mod info {
    pub const PROJECT_DB_ENCRYPTION: &[u8] = b"project-db-encryption-v1";
    pub const BACKUP_ENCRYPTION: &[u8] = b"backup-encryption-v1";
    pub const DEVICE_BIND: &[u8] = b"device-bind-key-v1";
}

/// Derive `output_len` bytes from `ikm` (input key material) + `salt` + `info`.
pub fn derive(ikm: &[u8], salt: &[u8], info: &[u8], output_len: usize) -> Result<Vec<u8>, AppError> {
    let hk = Hkdf::<Sha256>::new(Some(salt), ikm);
    let mut okm = vec![0u8; output_len];
    hk.expand(info, &mut okm)
        .map_err(|e| AppError::Crypto(format!("hkdf expand failed: {e}")))?;
    Ok(okm)
}

/// Derive a 32-byte AES key.
pub fn derive_32(ikm: &[u8], salt: &[u8], info: &[u8]) -> Result<[u8; 32], AppError> {
    let v = derive(ikm, salt, info, 32)?;
    let mut out = [0u8; 32];
    out.copy_from_slice(&v);
    Ok(out)
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/crypto/kdf.rs || { echo "FAIL"; exit 1; }
grep -q "hkdf" apps/admin/src-tauri/src/crypto/kdf.rs || { echo "FAIL"; exit 1; }
grep -q "hkdf" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no hkdf"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
