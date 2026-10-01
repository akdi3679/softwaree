# TASK ID: SECURITY-005.1
# TITLE: Add security: secret rotation helper
# STATUS: pending
# DEPENDENCIES: USER-011.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/auth/rotation.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Rotate the device key while keeping the project usable.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/auth/rotation.rs`:

```rust
use ed25519_dalek::{SigningKey, VerifyingKey, SECRET_KEY_LENGTH, SECRET_KEY_LENGTH};
use rand::RngCore;
use crate::error::AppResult;
use crate::state::AppState;
use tauri::State;

/// Generate a new device key, replacing the current one.
/// Steps:
/// 1. Generate new Ed25519 keypair
/// 2. Sign the new public key with the OLD private key (proof of continuity)
/// 3. Persist new key
/// 4. Notify Cloud of key rotation (it updates the project record)
pub async fn rotate_device_key(state: State<'_, AppState>) -> AppResult<NewDeviceKey> {
    let mut bytes = [0u8; SECRET_KEY_LENGTH];
    rand::thread_rng().fill_bytes(&mut bytes);
    let new_signing = SigningKey::from_bytes(&bytes);
    let new_verifying: VerifyingKey = new_signing.verifying_key();

    // Old key
    let old_signing = state.device_key.read().await.clone();
    let old_verifying = old_signing.verifying_key();
    let proof = old_signing.sign(new_verifying.as_bytes());

    // Persist
    let path = state.paths.keys_dir.join("device.key");
    tokio::fs::write(&path, new_signing.to_bytes()).await?;
    *state.device_key.write().await = new_signing.clone();

    Ok(NewDeviceKey {
        public_key_hex: hex::encode(new_verifying.as_bytes()),
        rotation_proof: hex::encode(proof.to_bytes()),
        old_public_key_hex: hex::encode(old_verifying.as_bytes()),
    })
}

#[derive(serde::Serialize)]
pub struct NewDeviceKey {
    pub public_key_hex: String,
    pub rotation_proof: String,
    pub old_public_key_hex: String,
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/auth/rotation.rs || { echo "FAIL"; exit 1; }
grep -q "rotate_device_key" apps/admin/src-tauri/src/auth/rotation.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
