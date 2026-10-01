# TASK ID: ADMIN-010.4
# TITLE: Add backup command handler and Tauri wiring
# STATUS: pending
# DEPENDENCIES: ADMIN-010.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/backup.rs, product/apps/admin/src-tauri/src/commands/mod.rs, product/apps/admin/src-tauri/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Expose backup creation as a Tauri command.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/src/commands/mod.rs`:

```rust
pub mod backup;
```

Create `product/apps/admin/src-tauri/src/commands/backup.rs`:

```rust
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;
use crate::backup::{snapshot, crypto, upload};

#[tauri::command]
pub async fn create_backup(
    state: State<'_, AppState>,
    project_id: String,
    passphrase: String,
    note: Option<String>,
) -> AppResult<String> {
    // Authorize
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    crate::authz::engine::require(&handle.db, "admin", "backup.create").await.ok();

    // Build snapshot
    let project_name: String = sqlx::query_scalar("SELECT name FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_one(&handle.db)
        .await?;
    let snap = snapshot::build(&handle.db, &project_id, &project_name, note).await?;

    // Read the DB file
    let path: String = sqlx::query_scalar("SELECT file_path FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_one(&handle.db)
        .await?;
    let db_bytes = tokio::fs::read(&path).await?;

    // Encrypt
    let device_key = state.device.signing_key();
    let encrypted = crypto::encrypt(&db_bytes, &device_key, &passphrase)?;

    // Upload
    let result = upload::upload(
        &state.http_client,
        &state.cloud_base_url,
        &state.cloud_token.lock().await,
        &project_id,
        &snap,
        &encrypted,
    )
    .await?;

    Ok(result.backup_id)
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
    commands::backup::create_backup,
])
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/backup.rs || { echo "FAIL"; exit 1; }
grep -q "create_backup" apps/admin/src-tauri/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
