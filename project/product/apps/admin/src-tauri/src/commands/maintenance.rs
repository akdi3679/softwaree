use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn vacuum_database(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<()> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    sqlx::query("VACUUM").execute(&handle.db).await?;
    Ok(())
}
