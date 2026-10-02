use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(serde::Serialize)]
pub struct CloudLoginResult {
    pub session_token: String,
    pub expires_at: Option<String>,
}

#[tauri::command]
pub async fn cloud_login(
    state: State<'_, AppState>,
    email: String,
    password: String,
) -> AppResult<CloudLoginResult> {
    let url = format!("{}/v1/accounts/sessions", state.cloud_base_url);
    let body = serde_json::json!({ "email": email, "password": password });
    let resp = state
        .http_client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("cloud login: {e}")))?;
    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(AppError::Network(format!("cloud login {status}: {text}")));
    }
    let parsed: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Network(format!("cloud login decode: {e}")))?;
    let token = parsed
        .get("token")
        .and_then(|v| v.as_str())
        .or_else(|| parsed.get("session_token").and_then(|v| v.as_str()))
        .ok_or_else(|| AppError::Network("cloud login: no token in response".into()))?
        .to_string();
    let expires_at = parsed
        .get("expires_at")
        .and_then(|v| v.as_str())
        .map(String::from);

    *state.cloud_token.lock().await = token.clone();

    Ok(CloudLoginResult { session_token: token, expires_at })
}