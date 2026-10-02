use tauri::State;

use crate::billing::enforce::{check_can_add_project, check_can_add_user, Plan};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[tauri::command]
pub async fn current_plan(state: State<'_, AppState>) -> AppResult<serde_json::Value> {
    let plan = state
        .plan_for_current_project()
        .await
        .map(|s| Plan::from_str(&s))
        .unwrap_or(Plan::Local);
    Ok(serde_json::json!({
        "plan": plan,
        "max_users": plan.max_users(),
        "max_projects": plan.max_projects(),
        "backup_enabled": plan.backup_enabled(),
        "can_install_custom_modules": plan.can_install_custom_modules(),
    }))
}

#[tauri::command]
pub async fn check_user_quota(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<()> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };
    let plan_str = state.plan_for_project(&project_id).await?;
    let plan = Plan::from_str(&plan_str);
    check_can_add_user(&handle.db, plan).await
}

#[tauri::command]
pub async fn check_project_quota(state: State<'_, AppState>) -> AppResult<()> {
    let plan_str = state
        .plan_for_current_project()
        .await
        .unwrap_or_else(|_| "local".to_string());
    let plan = Plan::from_str(&plan_str);
    check_can_add_project(&state.paths.projects_dir, plan).await
}
