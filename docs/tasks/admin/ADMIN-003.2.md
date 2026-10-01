# TASK ID: ADMIN-003.2
# TITLE: Add project command — list projects
# STATUS: pending
# DEPENDENCIES: ADMIN-003.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/project.rs, product/apps/admin/src-tauri/src/commands/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a Tauri command that lists all projects known to the Admin.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/mod.rs`:

```rust
pub mod error;
pub mod project;
pub mod ping;
```

Replace `product/apps/admin/src-tauri/src/commands.rs` content (we'll keep mod.rs and remove the old file later) — actually just delete the old `commands.rs` since we now have `commands/mod.rs`.

Create `product/apps/admin/src-tauri/src/commands/project.rs`:

```rust
use serde::Serialize;
use tauri::State;
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

#[tauri::command]
pub async fn list_local_projects(state: State<'_, AppState>) -> AppResult<Vec<LocalProject>> {
    let entries = tokio::fs::read_dir(&state.paths.projects_dir).await?;
    let mut projects = Vec::new();
    for entry in entries {
        let entry = entry?;
        let project_id = entry.file_name().to_string_lossy().to_string();
        let db_path = entry.path().join("project.db");
        if !db_path.exists() {
            continue;
        }
        // Get metadata from project_metadata.json if it exists
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
```

Update `product/apps/admin/src-tauri/src/lib.rs` to register the new command:

```rust
.invoke_handler(tauri::generate_handler![
    commands::ping::ping,
    commands::project::list_local_projects,
])
```

Move the old `ping` function from `commands.rs` to `commands/ping.rs` and add it to mod.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/commands/mod.rs || { echo "FAIL: no mod.rs"; exit 1; }
grep -q "list_local_projects" apps/admin/src-tauri/src/commands/project.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
