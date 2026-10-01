# TASK ID: ADMIN-068.1
# TITLE: Add Admin: runtime validation of events (Zod on write)
# STATUS: pending
# DEPENDENCIES: CONTRACT-089.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/validate_event.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every event going into the DB passes through Zod (or Rust equivalent).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/validate_event.rs`:

```rust
use crate::error::AppResult;
use serde_json::Value;
use ts_rs::TS;

#[derive(TS)]
#[ts(export, export_to = "../../../contracts/src/schemas/event.ts")]
pub struct EventEnvelope {
    pub id: String,
    pub event_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub version: i32,
    pub occurred_at: String,
    pub payload: Value,
    pub actor_id: String,
    pub device_id: String,
    pub command_id: String,
    pub idempotency_key: String,
}

pub fn validate(event: &Value) -> AppResult<()> {
    // Verify required fields
    let obj = event.as_object().ok_or_else(|| crate::error::AppError::Validation("event must be an object".into()))?;
    for field in &["id", "event_type", "aggregate_type", "aggregate_id", "version", "occurred_at", "actor_id", "device_id", "command_id", "idempotency_key", "payload"] {
        if !obj.contains_key(*field) {
            return Err(crate::error::AppError::Validation(format!("missing field: {field}")));
        }
    }
    // Verify ID formats
    if let Some(id) = obj.get("id").and_then(|v| v.as_str()) {
        if !id.starts_with("evt_") { return Err(crate::error::AppError::Validation("id must start with evt_".into())); }
    }
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/validate_event.rs || { echo "FAIL"; exit 1; }
grep -q "validate" apps/admin/src-tauri/src/commands/validate_event.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
