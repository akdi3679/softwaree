use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct Annotation {
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub note: String,
    pub category: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AnnotationResult {
    pub event_id: String,
    pub sequence: Option<i64>,
}

#[tauri::command]
pub async fn add_annotation(
    state: State<'_, AppState>,
    annotation: Annotation,
) -> AppResult<AnnotationResult> {
    if annotation.note.trim().is_empty() {
        return Err(AppError::Validation("note cannot be empty".into()));
    }
    let sync = state.sync.read().await;
    let _client = sync.as_ref().ok_or_else(|| AppError::NotFound("not connected to Admin".into()))?;
    Err(AppError::PermissionDenied("annotations not supported in v1; User is read-only".into()))
}
