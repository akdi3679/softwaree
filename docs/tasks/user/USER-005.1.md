# TASK ID: USER-005.1
# TITLE: Add User command-issuance for read-only annotations
# STATUS: pending
# DEPENDENCIES: CLOUD-008.3
# ALLOWED FILES: product/apps/user/src-tauri/src/commands/annotate.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Allow a User to add an annotation (note) on an aggregate (e.g., a patient). The annotation is sent to the Admin and stored as a new event.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/commands/annotate.rs`:

```rust
use serde::{Deserialize, Serialize};
use serde_json::json;
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
    pub sequence: Option<i64>, // None if Admin not reachable
}

#[tauri::command]
pub async fn add_annotation(
    state: State<'_, AppState>,
    annotation: Annotation,
) -> AppResult<AnnotationResult> {
    if annotation.note.trim().is_empty() {
        return Err(AppError::Validation("note cannot be empty".into()));
    }

    // Check connection
    let sync = state.sync.read().await;
    let _client = sync.as_ref().ok_or_else(|| AppError::NotFound("not connected to Admin".into()))?;

    // For v1, the User CANNOT mutate Admin data. The annotation is stored locally and queued
    // to be sent when the Admin adds a 'user.annotate' capability in v2.
    //
    // We refuse this with a clear error: "Annotations are not supported in v1."
    //
    // This is intentional — the User is strictly read-only.
    Err(AppError::PermissionDenied(
        "annotations not supported in v1; User is read-only".into(),
    ))
}
```

Note: this returns an error because the architecture is strictly read-only for Users. The hook is here for v2.

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/commands/annotate.rs || { echo "FAIL"; exit 1; }
grep -q "PermissionDenied" apps/user/src-tauri/src/commands/annotate.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
