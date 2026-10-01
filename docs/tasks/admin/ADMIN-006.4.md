# TASK ID: ADMIN-006.4
# TITLE: Wire user commands to Tauri
# STATUS: pending
# DEPENDENCIES: ADMIN-006.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/project.rs, product/apps/admin/src-tauri/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Expose create_user, change_role, remove_user as Tauri commands.

## REQUIRED IMPLEMENTATION

Append to `product/apps/admin/src-tauri/src/commands/project.rs`:

```rust
use crate::commands::handlers::{
    self, ChangeRoleRequest, ChangeRoleResult, CreateUserRequest, CreateUserResult,
    RemoveUserRequest,
};

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
```

Update `product/apps/admin/src-tauri/src/lib.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    commands::ping::ping,
    commands::project::list_local_projects,
    commands::project::open_project,
    commands::project::create_project,
    commands::project::invite_user,
    commands::project::create_user,
    commands::project::change_user_role,
    commands::project::remove_user,
])
```

## TESTS

```bash
cd product
grep -q "create_user" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL"; exit 1; }
grep -q "change_user_role" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL: no change"; exit 1; }
grep -q "remove_user" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL: no remove"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
