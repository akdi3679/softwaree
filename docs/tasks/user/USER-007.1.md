# TASK ID: USER-007.1
# TITLE: Add User device handover (transfer to new device)
# STATUS: pending
# DEPENDENCIES: MODULE-003.3
# ALLOWED FILES: product/apps/user/src-tauri/src/commands/handover.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
When a User buys a new device, they can transfer their session to the new device.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/commands/handover.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct HandoverRequest {
    pub old_device_pubkey: String,
    pub handover_token: String, // from the old device
}

#[derive(Debug, Serialize)]
pub struct HandoverResult {
    pub session_token: String,
    pub admin_endpoint: String,
}

/// Accept a handover from an old device.
/// 1. Verify the handover token was signed by the old device
/// 2. Generate a new session token for the new device
/// 3. Tell the Admin to revoke the old device's session
#[tauri::command]
pub async fn accept_handover(
    state: State<'_, AppState>,
    request: HandoverRequest,
) -> AppResult<HandoverResult> {
    // Verify the handover token
    // Format: "handover:" + timestamp + ":" + signature
    let parts: Vec<&str> = request.handover_token.split(':').collect();
    if parts.len() != 3 || parts[0] != "handover" {
        return Err(AppError::Validation("invalid handover token format".into()));
    }
    let signature_b64 = parts[2];
    let signature = B64.decode(signature_b64).map_err(|e| AppError::Crypto(format!("base64: {e}")))?;
    let signed_data = format!("handover:{}:{}", parts[1], request.old_device_pubkey);
    crate::crypto::device_key::DeviceKey::verify(
        &B64.decode(&request.old_device_pubkey).map_err(|e| AppError::Crypto(e.to_string()))?,
        signed_data.as_bytes(),
        &signature,
    )?;

    // Generate new session token
    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    let session_token = B64.encode(token_bytes);

    // Tell the Admin to revoke the old device
    // (Real impl: send a message to the Admin's sync server)

    Ok(HandoverResult {
        session_token,
        admin_endpoint: "100.100.100.50:9420".to_string(),
    })
}

/// Generate a handover token (on the old device).
#[tauri::command]
pub async fn generate_handover_token(
    state: State<'_, AppState>,
) -> AppResult<String> {
    let device_pubkey = state.device.key.public_key_b64();
    let timestamp = chrono::Utc::now().timestamp();
    let signed_data = format!("handover:{timestamp}:{device_pubkey}");
    let signature = state.device.key.sign(signed_data.as_bytes());
    Ok(format!("handover:{timestamp}:{}", B64.encode(signature)))
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/commands/handover.rs || { echo "FAIL"; exit 1; }
grep -q "accept_handover" apps/user/src-tauri/src/commands/handover.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
