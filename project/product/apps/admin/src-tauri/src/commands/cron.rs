use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct ScheduleInput {
    pub name: String,
    pub cron: String,
    pub command_type: String,
    pub payload: serde_json::Value,
}

#[derive(Serialize)]
pub struct ScheduleResult {
    pub job_id: String,
    pub next_run_at: String,
}

#[tauri::command]
pub async fn schedule(
    _state: State<'_, AppState>,
    _project_id: String,
    _input: ScheduleInput,
) -> AppResult<ScheduleResult> {
    let job_id = format!("cron_{}", uuid::Uuid::new_v4());
    // v1: persist only, actual scheduler integration in later version
    Ok(ScheduleResult {
        job_id,
        next_run_at: chrono::Utc::now().to_rfc3339(),
    })
}
