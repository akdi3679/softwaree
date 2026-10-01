# TASK ID: ADMIN-005.9
# TITLE: Wire Tauri command for invite_user
# STATUS: pending
# DEPENDENCIES: ADMIN-005.8
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/project.rs, product/apps/admin/src-tauri/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Expose the invite_user command to the frontend via Tauri.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/src/commands/mod.rs`:

```rust
pub mod error;
pub mod project;
pub mod ping;
pub mod engine;
pub mod handlers;
```

Update `product/apps/admin/src-tauri/src/commands/project.rs` to add a Tauri command for invite_user:

```rust
use tauri::State;
use crate::commands::handlers::{self, InviteUserRequest, InviteUserResult};
use crate::db::project_db;
use crate::error::AppResult;
use crate::state::AppState;

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
```

Add to `AppState`:

```rust
impl AppState {
    pub fn device_id(&self) -> String {
        self.device.device_id.clone().unwrap_or_else(|| "unknown".to_string())
    }
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
])
```

## TESTS

```bash
cd product
grep -q "invite_user" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL"; exit 1; }
grep -q "commands::project::invite_user" apps/admin/src-tauri/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
