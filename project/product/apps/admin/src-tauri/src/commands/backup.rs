use tauri::State;

use crate::backup::{crypto, restore, snapshot, upload, verify};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[tauri::command]
pub async fn create_backup(
    state: State<'_, AppState>,
    project_id: String,
    passphrase: String,
    note: Option<String>,
) -> AppResult<String> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id} not open")))?
    };

    let project_name: String = sqlx::query_scalar("SELECT name FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_one(&handle.db)
        .await?;

    let snap = snapshot::build(&handle.db, &project_id, &project_name, note).await?;
    let db_bytes = tokio::fs::read(&handle.db_path).await?;
    let device_key = state.load_device_key().await?;
    let encrypted = crypto::encrypt(&db_bytes, &device_key, &passphrase)?;
    let token = state.cloud_token.lock().await.clone();

    let backup_id = upload::upload(
        &state.http_client,
        &state.cloud_base_url,
        &token,
        &project_id,
        &snap,
        &encrypted,
    )
    .await?;

    Ok(backup_id)
}

#[tauri::command]
pub async fn trigger_backup(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<serde_json::Value> {
    let start = std::time::Instant::now();
    let passphrase = std::env::var("BACKUP_PASSPHRASE").unwrap_or_default();
    let backup_id = create_backup(state, project_id, passphrase, Some("manual".into())).await?;
    Ok(serde_json::json!({
        "backup_id": backup_id,
        "duration_ms": start.elapsed().as_millis() as u64,
    }))
}

#[tauri::command]
pub async fn restore_backup(
    state: State<'_, AppState>,
    project_id: String,
    backup_id: String,
    passphrase: String,
) -> AppResult<()> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id} not open")))?
    };
    let device_key = state.load_device_key().await?;
    let token = state.cloud_token.lock().await.clone();
    restore::restore(
        &state.http_client,
        &state.cloud_base_url,
        &token,
        &project_id,
        &backup_id,
        &passphrase,
        &device_key,
        &handle.db_path,
    )
    .await
}

#[tauri::command]
pub async fn verify_backup(
    state: State<'_, AppState>,
    project_id: String,
    backup_id: String,
    passphrase: String,
) -> AppResult<verify::VerifyResult> {
    let device_key = state.load_device_key().await?;
    let token = state.cloud_token.lock().await.clone();
    verify::verify(
        &state.http_client,
        &state.cloud_base_url,
        &token,
        &project_id,
        &backup_id,
        &passphrase,
        &device_key,
    )
    .await
}
