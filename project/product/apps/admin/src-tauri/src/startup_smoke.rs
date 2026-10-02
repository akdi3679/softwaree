use crate::error::AppResult;
use crate::state::AppState;

pub async fn run(state: &AppState) -> AppResult<()> {
    let projects = state.projects.read().await;
    tracing::info!("startup: {} projects loaded", projects.len());
    drop(projects);

    let free = fs2::available_space(&state.paths.data_dir)
        .map_err(|e| crate::error::AppError::Io(e))?;
    tracing::info!("startup: {} bytes free on data dir", free);
    if free < 100 * 1024 * 1024 {
        return Err(crate::error::AppError::Internal("disk full".into()));
    }

    Ok(())
}
