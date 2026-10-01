# TASK ID: ADMIN-003.4
# TITLE: Add auth crypto module — device keypair
# STATUS: pending
# DEPENDENCIES: ADMIN-003.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/crypto/device_key.rs, product/apps/admin/src-tauri/src/crypto/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the device keypair module — generates, stores, retrieves the Admin's ed25519 keypair.

## REQUIRED IMPLEMENTATION

Add to `product/apps/admin/src-tauri/Cargo.toml` dependencies:

```toml
ed25519-dalek = { version = "2", features = ["rand_core"] }
rand = "0.8"
base64 = "0.22"
```

Create `product/apps/admin/src-tauri/src/crypto/mod.rs`:

```rust
pub mod device_key;
pub mod kdf;
```

Create `product/apps/admin/src-tauri/src/crypto/device_key.rs`:

```rust
use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use base64::{Engine, engine::general_purpose::STANDARD as B64};
use crate::error::{AppError, AppResult};

/// The Admin's device identity. One keypair per Admin device.
pub struct DeviceKey {
    signing: SigningKey,
}

impl DeviceKey {
    /// Generate a new random keypair.
    pub fn generate() -> Self {
        let mut csprng = OsRng;
        let signing = SigningKey::generate(&mut csprng);
        Self { signing }
    }

    /// Reconstruct from raw 32-byte private key.
    pub fn from_bytes(bytes: &[u8]) -> AppResult<Self> {
        if bytes.len() != 32 {
            return Err(AppError::Crypto(format!("invalid key length: {}", bytes.len())));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(bytes);
        let signing = SigningKey::from_bytes(&arr);
        Ok(Self { signing })
    }

    /// Get the public key (verifying key), 32 bytes.
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing.verifying_key().to_bytes()
    }

    /// Public key, base64-encoded (for the Cloud).
    pub fn public_key_b64(&self) -> String {
        B64.encode(self.public_key_bytes())
    }

    /// Sign a message. Returns 64-byte signature.
    pub fn sign(&self, message: &[u8]) -> [u8; 64] {
        let sig = self.signing.sign(message);
        sig.to_bytes()
    }

    /// Verify a signature from a peer (e.g., the Cloud).
    pub fn verify(public_key: &[u8], message: &[u8], signature: &[u8]) -> AppResult<()> {
        if public_key.len() != 32 {
            return Err(AppError::Crypto("invalid public key length".into()));
        }
        if signature.len() != 64 {
            return Err(AppError::Crypto("invalid signature length".into()));
        }
        let mut pk_arr = [0u8; 32];
        pk_arr.copy_from_slice(public_key);
        let mut sig_arr = [0u8; 64];
        sig_arr.copy_from_slice(signature);
        let pk = VerifyingKey::from_bytes(&pk_arr)
            .map_err(|e| AppError::Crypto(format!("invalid public key: {e}")))?;
        let sig = Signature::from_bytes(&sig_arr);
        pk.verify(message, &sig)
            .map_err(|e| AppError::Crypto(format!("verify failed: {e}")))?;
        Ok(())
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/crypto/device_key.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/crypto/mod.rs || { echo "FAIL: no mod"; exit 1; }
grep -q "ed25519-dalek" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no ed25519"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
