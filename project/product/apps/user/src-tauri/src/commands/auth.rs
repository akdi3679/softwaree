use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct UserLogin {
    pub user_id: String,
    pub display_name: String,
    pub session_token: String,
}

#[tauri::command]
pub async fn login_user(
    _state: State<'_, AppState>,
    user_id: String,
    display_name: String,
) -> AppResult<UserLogin> {
    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    Ok(UserLogin {
        user_id,
        display_name,
        session_token: B64.encode(token_bytes),
    })
}

#[tauri::command]
pub async fn logout_user(
    _state: State<'_, AppState>,
    _session_token: String,
) -> AppResult<()> {
    Ok(())
}
