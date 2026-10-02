use serde::Serialize;
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub admin_id: String,
    pub display_name: String,
    pub session_token: String,
}

#[tauri::command]
pub async fn login_admin(
    _state: State<'_, AppState>,
    passphrase: String,
) -> AppResult<LoginResult> {
    if passphrase.is_empty() {
        return Err(AppError::Validation("passphrase required".into()));
    }
    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    let session_token = hex::encode(token_bytes);
    Ok(LoginResult {
        admin_id: "admin".to_string(),
        display_name: "Administrator".to_string(),
        session_token,
    })
}

#[tauri::command]
pub async fn logout_admin(
    _state: State<'_, AppState>,
    _session_token: String,
) -> AppResult<()> {
    Ok(())
}
