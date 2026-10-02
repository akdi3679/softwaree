use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use crate::sync::client::{AdminEndpoint, SyncClient};

#[tauri::command]
pub async fn connect_to_admin(
    state: State<'_, AppState>,
    host: String,
    port: u16,
    user_id: String,
    project_id: String,
    auth_token: String,
) -> AppResult<String> {
    let endpoint = AdminEndpoint { host, port };
    let (client, session_id) = SyncClient::connect(
        &endpoint,
        &user_id,
        &state.device.key,
        &project_id,
        &auth_token,
    ).await?;
    *state.sync.write().await = Some(client);
    Ok(session_id)
}

#[tauri::command]
pub async fn disconnect_from_admin(state: State<'_, AppState>) -> AppResult<()> {
    *state.sync.write().await = None;
    Ok(())
}

#[tauri::command]
pub async fn sync_now(state: State<'_, AppState>) -> AppResult<i64> {
    let client = state.sync.read().await;
    let client = client.as_ref().ok_or_else(|| AppError::NotFound("not connected".into()))?;
    let position = {
        let proj = state.active_projection.read().await;
        match proj.as_ref() {
            Some(p) => p.get_position().await?,
            None => 0,
        }
    };
    client.ack(position).await?;
    Ok(position)
}
