use serde::Serialize;
use tauri::State;
use crate::commands::handlers::{
    self, ChangeRoleRequest, ChangeRoleResult, CreateUserRequest, CreateUserResult,
    InviteUserRequest, InviteUserResult, RemoveUserRequest,
};
use crate::db::project_db;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct LocalProject {
    pub project_id: String,
    pub name: String,
    pub state: String,
    pub path: String,
    pub last_opened_at: String,
}

#[derive(Debug, serde::Serialize)]
pub struct ProjectMetadataResponse {
    pub project_id: String,
    pub name: String,
    pub admin_last_name: String,
    pub business_type: String,
    pub business_name: String,
    pub state: String,
}

#[tauri::command]
pub async fn list_local_projects(state: State<'_, AppState>) -> AppResult<Vec<LocalProject>> {
    let mut entries = tokio::fs::read_dir(&state.paths.projects_dir).await?;
    let mut projects = Vec::new();
    while let Some(entry) = entries.next_entry().await? {
        let project_id = entry.file_name().to_string_lossy().to_string();
        let db_path = entry.path().join("project.db");
        if !db_path.exists() {
            continue;
        }
        let meta_path = entry.path().join("metadata.json");
        let (name, state_str, last_opened) = if meta_path.exists() {
            let s = tokio::fs::read_to_string(&meta_path).await.unwrap_or_default();
            let v: serde_json::Value = serde_json::from_str(&s).unwrap_or_default();
            (
                v["name"].as_str().unwrap_or("").to_string(),
                v["state"].as_str().unwrap_or("creating").to_string(),
                v["last_opened_at"].as_str().unwrap_or("").to_string(),
            )
        } else {
            (project_id.clone(), "creating".to_string(), String::new())
        };
        projects.push(LocalProject {
            project_id,
            name,
            state: state_str,
            path: db_path.to_string_lossy().to_string(),
            last_opened_at: last_opened,
        });
    }
    Ok(projects)
}

#[tauri::command]
pub async fn open_project(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<ProjectMetadataResponse> {
    let db = project_db::open_project(&state, &project_id).await?;
    let response = ProjectMetadataResponse {
        project_id: db.metadata.project_id.clone(),
        name: db.metadata.name.clone(),
        admin_last_name: db.metadata.admin_last_name.clone(),
        business_type: db.metadata.business_type.clone(),
        business_name: db.metadata.business_name.clone(),
        state: db.metadata.state.clone(),
    };
    let mut projects = state.projects.write().await;
    projects.insert(project_id.clone(), crate::state::ProjectHandle {
        project_id: project_id.clone(),
        db_path: state.paths.projects_dir.join(&project_id).join("project.db"),
        db: db.pool,
        last_sequence: 0,
    });
    Ok(response)
}

#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    name: String,
    admin_last_name: String,
    business_type: String,
    business_name: String,
) -> AppResult<ProjectMetadataResponse> {
    let db = project_db::create_project(&state, &name, &admin_last_name, &business_type, &business_name).await?;
    let project_id = db.metadata.project_id.clone();
    let response = ProjectMetadataResponse {
        project_id: project_id.clone(),
        name: db.metadata.name.clone(),
        admin_last_name: db.metadata.admin_last_name.clone(),
        business_type: db.metadata.business_type.clone(),
        business_name: db.metadata.business_name.clone(),
        state: db.metadata.state.clone(),
    };
    let mut projects = state.projects.write().await;
    projects.insert(project_id.clone(), crate::state::ProjectHandle {
        project_id: project_id.clone(),
        db_path: state.paths.projects_dir.join(&project_id).join("project.db"),
        db: db.pool,
        last_sequence: 0,
    });
    Ok(response)
}

#[tauri::command]
pub async fn invite_user(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    email: String,
    initial_role: String,
) -> AppResult<InviteUserResult> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let device_id = state.device_id();
    let req = InviteUserRequest { email, initial_role };
    handlers::invite_user(&handle.db, &actor_user_id, &device_id, req).await
}

#[tauri::command]
pub async fn create_user(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    email: String,
    display_name: String,
    initial_role: String,
) -> AppResult<CreateUserResult> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let device_id = state.device_id();
    let req = CreateUserRequest { email, display_name, initial_role };
    handlers::create_user(&handle.db, &actor_user_id, &device_id, req).await
}

#[tauri::command]
pub async fn change_user_role(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    user_id: String,
    new_role: String,
) -> AppResult<ChangeRoleResult> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let device_id = state.device_id();
    let req = ChangeRoleRequest { user_id, new_role };
    handlers::change_role(&handle.db, &actor_user_id, &device_id, req).await
}

#[tauri::command]
pub async fn remove_user(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    user_id: String,
    reason: String,
) -> AppResult<()> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let device_id = state.device_id();
    let req = RemoveUserRequest { user_id, reason };
    handlers::remove_user(&handle.db, &actor_user_id, &device_id, req).await
}

#[tauri::command]
pub async fn list_users(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<Vec<crate::domain::user::User>> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let rows: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, email, display_name, state, created_at FROM users",
    )
    .fetch_all(&handle.db)
    .await?;
    Ok(rows.into_iter().map(|r| crate::domain::user::User {
        id: r.0,
        email: r.1,
        display_name: r.2,
        state: match r.3.as_str() {
            "active" => crate::domain::user::UserState::Active,
            "pending_invitation" => crate::domain::user::UserState::PendingInvitation,
            "pending_approval" => crate::domain::user::UserState::PendingApproval,
            "suspended" => crate::domain::user::UserState::Suspended,
            _ => crate::domain::user::UserState::Removed,
        },
        created_at: chrono::DateTime::parse_from_rfc3339(&r.4).map(|dt| dt.with_timezone(&chrono::Utc)).unwrap_or_else(|_| chrono::Utc::now()),
        roles: vec![],
    }).collect())
}

#[tauri::command]
pub async fn list_roles(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<Vec<crate::domain::role::Role>> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let rows: Vec<(String, String, String, i64, String)> = sqlx::query_as(
        "SELECT id, name, display_name, is_built_in, created_at FROM roles",
    )
    .fetch_all(&handle.db)
    .await?;
    Ok(rows.into_iter().map(|r| crate::domain::role::Role {
        id: r.0,
        name: r.1,
        display_name: r.2,
        is_built_in: r.3 != 0,
        created_at: chrono::DateTime::parse_from_rfc3339(&r.4).map(|dt| dt.with_timezone(&chrono::Utc)).unwrap_or_else(|_| chrono::Utc::now()),
        permissions: vec![],
    }).collect())
}

