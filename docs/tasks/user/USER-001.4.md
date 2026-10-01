# TASK ID: USER-001.4
# TITLE: Add User device identity (Ed25519)
# STATUS: pending
# DEPENDENCIES: USER-001.3
# ALLOWED FILES: product/apps/user/src-tauri/src/crypto/device_key.rs, product/apps/user/src-tauri/src/crypto/device_identity.rs, product/apps/user/src-tauri/src/crypto/kdf.rs, product/apps/user/src-tauri/src/crypto/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the User's Ed25519 device key + HKDF.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/crypto/mod.rs`:

```rust
pub mod device_key;
pub mod device_identity;
pub mod kdf;
```

Create `product/apps/user/src-tauri/src/crypto/device_key.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use ed25519_dalek::{Signer, SigningKey, Verifier, VerifyingKey, Signature};
use rand::RngCore;

use crate::error::AppResult;

/// A device's Ed25519 key pair.
#[derive(Clone)]
pub struct DeviceKey {
    pub signing: SigningKey,
}

impl DeviceKey {
    pub fn generate() -> Self {
        let mut bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut bytes);
        Self { signing: SigningKey::from_bytes(&bytes) }
    }

    pub fn from_bytes(bytes: &[u8; 32]) -> Self {
        Self { signing: SigningKey::from_bytes(bytes) }
    }

    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing.verifying_key().to_bytes()
    }

    pub fn public_key_b64(&self) -> String {
        B64.encode(self.public_key_bytes())
    }

    pub fn sign(&self, msg: &[u8]) -> Vec<u8> {
        self.signing.sign(msg).to_bytes().to_vec()
    }

    /// A stable 32-byte secret derived from the device key, used for HMAC + encryption keys.
    pub fn sign_bytes(&self) -> [u8; 32] {
        self.signing.to_bytes()
    }

    pub fn verify(public_key: &[u8], msg: &[u8], signature: &[u8]) -> AppResult<()> {
        if public_key.len() != 32 {
            return Err(crate::error::AppError::Crypto("invalid public key length".into()));
        }
        let mut pk_bytes = [0u8; 32];
        pk_bytes.copy_from_slice(public_key);
        let pk = VerifyingKey::from_bytes(&pk_bytes)?;
        let sig_arr: [u8; 64] = signature.try_into()
            .map_err(|_| crate::error::AppError::Crypto("signature must be 64 bytes".into()))?;
        let sig = Signature::from_bytes(&sig_arr);
        pk.verify(msg, &sig)?;
        Ok(())
    }
}
```

Create `product/apps/user/src-tauri/src/crypto/device_identity.rs`:

```rust
use std::path::Path;
use rand::RngCore;

use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

const DEVICE_KEY_FILE: &str = "device.key";

pub fn load_or_create(keys_dir: &Path) -> AppResult<DeviceKey> {
    let key_path = keys_dir.join(DEVICE_KEY_FILE);
    if key_path.exists() {
        let bytes = std::fs::read(&key_path)?;
        if bytes.len() != 32 {
            return Err(AppError::Crypto(format!("device key wrong length: {}", bytes.len())));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(DeviceKey::from_bytes(&arr))
    } else {
        std::fs::create_dir_all(keys_dir)?;
        let key = DeviceKey::generate();
        std::fs::write(&key_path, key.sign_bytes())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&key_path, std::fs::Permissions::from_mode(0o600))?;
        }
        Ok(key)
    }
}
```

Create `product/apps/user/src-tauri/src/crypto/kdf.rs`:

```rust
use hkdf::Hkdf;
use sha2::Sha256;
use crate::error::{AppError, AppResult};

pub fn derive(device_bytes: &[u8], info: &[u8], out: &mut [u8]) -> AppResult<()> {
    let hk = Hkdf::<Sha256>::new(None, device_bytes);
    hk.expand(info, out)
        .map_err(|e| AppError::Crypto(format!("hkdf: {e}")))
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/crypto/device_key.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/crypto/device_identity.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/crypto/kdf.rs || { echo "FAIL: no kdf"; exit 1; }
echo "OK"
```
