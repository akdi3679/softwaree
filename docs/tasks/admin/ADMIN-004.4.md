# TASK ID: ADMIN-004.4
# TITLE: Add command to open a project
# STATUS: pending
# DEPENDENCIES: ADMIN-004.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/project.rs, product/apps/admin/src-tauri/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a Tauri command `open_project` that opens a project database and stores it in app state.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/src/commands/project.rs` to add:

```rust
use tauri::State;
use crate::db::project_db::{self, ProjectDatabase};
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use std::sync::Arc;

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
    // Store the open pool in state for subsequent commands
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

#[derive(Debug, serde::Serialize)]
pub struct ProjectMetadataResponse {
    pub project_id: String,
    pub name: String,
    pub admin_last_name: String,
    pub business_type: String,
    pub business_name: String,
    pub state: String,
}
```

Update `product/apps/admin/src-tauri/src/lib.rs` to register:

```rust
.invoke_handler(tauri::generate_handler![
    commands::ping::ping,
    commands::project::list_local_projects,
    commands::project::open_project,
    commands::project::create_project,
])
```

## TESTS

```bash
cd product
grep -q "open_project" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL"; exit 1; }
grep -q "create_project" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL: no create"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
