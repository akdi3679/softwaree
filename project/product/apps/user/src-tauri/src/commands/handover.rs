use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct HandoverRequest {
    pub old_device_pubkey: String,
    pub handover_token: String,
}

#[derive(Debug, Serialize)]
pub struct HandoverResult {
    pub session_token: String,
    pub admin_endpoint: String,
}

#[tauri::command]
pub async fn accept_handover(
    state: State<'_, AppState>,
    request: HandoverRequest,
) -> AppResult<HandoverResult> {
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

    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    let session_token = B64.encode(token_bytes);

    Ok(HandoverResult {
        session_token,
        admin_endpoint: "100.100.100.50:9420".to_string(),
    })
}

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
