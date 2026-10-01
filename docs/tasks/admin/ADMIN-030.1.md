# TASK ID: ADMIN-030.1
# TITLE: Add Admin: device swap (replace lost device) full flow
# STATUS: pending
# DEPENDENCIES: ARCH-009.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/device_replace.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Backend: full device replacement ceremony (signed handoff).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/device_replace.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use ed25519_dalek::{SigningKey, VerifyingKey};
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn begin_device_replacement(state: State<'_, AppState>, project_id: String, reason: String) -> AppResult<ReplacementTicket> {
    // 1. Generate a new keypair locally
    let mut new_bytes = [0u8; 32];
    rand::Rng::fill(&mut rand::thread_rng(), &mut new_bytes);
    let new_sk = SigningKey::from_bytes(&new_bytes);
    let new_pk = new_sk.verifying_key();
    // 2. Sign the new public key with the OLD key (proof of continuity)
    let old_sk = state.device_key.read().await.clone();
    let proof = old_sk.sign(new_pk.as_bytes());
    // 3. Store the new key (pending Cloud approval)
    let ticket = format!("rt_{}", uuid::Uuid::new_v4());
    state.pending_replacement.write().await.insert(ticket.clone(), (new_sk.clone(), reason.clone()));
    // 4. Return to the user for them to submit to Cloud
    Ok(ReplacementTicket {
        ticket,
        new_public_key_hex: hex::encode(new_pk.as_bytes()),
        old_public_key_hex: hex::encode(old_sk.verifying_key().as_bytes()),
        proof_hex: hex::encode(proof.to_bytes()),
        reason,
        project_id,
    })
}

#[tauri::command]
pub async fn submit_device_replacement(state: State<'_, AppState>, ticket: String) -> AppResult<()> {
    let (new_sk, _reason) = state.pending_replacement.read().await.get(&ticket).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("ticket".into()))?;
    // Activate the new key locally
    let path = state.paths.keys_dir.join("device.key");
    tokio::fs::write(&path, new_sk.to_bytes()).await?;
    *state.device_key.write().await = new_sk;
    state.pending_replacement.write().await.remove(&ticket);
    Ok(())
}

#[derive(serde::Serialize)]
pub struct ReplacementTicket {
    pub ticket: String,
    pub new_public_key_hex: String,
    pub old_public_key_hex: String,
    pub proof_hex: String,
    pub reason: String,
    pub project_id: String,
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/device_replace.rs || { echo "FAIL"; exit 1; }
grep -q "begin_device_replacement" apps/admin/src-tauri/src/commands/device_replace.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
