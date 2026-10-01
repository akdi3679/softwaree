# TASK ID: ADMIN-042.1
# TITLE: Add Admin: batch commands (multiple ops in one envelope)
# STATUS: pending
# DEPENDENCIES: ADMIN-041.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/batch.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can submit N commands atomically. All or nothing.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/batch.rs`:

```rust
use sqlx::SqlitePool;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;
use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize)]
pub struct BatchInput {
    pub commands: Vec<BatchCommand>,
    pub atomic: bool,    // if true, all-or-nothing
}

#[derive(Deserialize)]
pub struct BatchCommand {
    pub command_type: String,
    pub payload: serde_json::Value,
}

#[derive(Serialize)]
pub struct BatchOutput {
    pub results: Vec<BatchResult>,
    pub all_succeeded: bool,
}

#[derive(Serialize)]
pub struct BatchResult {
    pub command_index: usize,
    pub success: bool,
    pub response: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn execute_batch(state: State<'_, AppState>, project_id: String, input: BatchInput) -> AppResult<BatchOutput> {
    let handle = state.projects.read().await.get(&project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
    let mut results = vec![];
    let mut tx = handle.db.begin().await?;
    for (i, cmd) in input.commands.iter().enumerate() {
        // Dispatch to the right handler. Stub for v1.
        let response = match crate::commands::dispatch(&mut tx, "usr_admin", "dev_1", &cmd.command_type, &cmd.payload).await {
            Ok(r) => BatchResult { command_index: i, success: true, response: Some(r), error: None },
            Err(e) => {
                if input.atomic { tx.rollback().await?; return Err(e); }
                BatchResult { command_index: i, success: false, response: None, error: Some(e.to_string()) }
            }
        };
        results.push(response);
    }
    tx.commit().await?;
    Ok(BatchOutput { all_succeeded: results.iter().all(|r| r.success), results })
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/batch.rs || { echo "FAIL"; exit 1; }
grep -q "execute_batch" apps/admin/src-tauri/src/commands/batch.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
