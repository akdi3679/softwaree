# TASK ID: ADMIN-041.1
# TITLE: Add Admin: idempotency on every command
# STATUS: pending
# DEPENDENCIES: ADMIN-040.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/idempotency.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Resend-safe: same command_id with same payload returns same result.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/idempotency.rs`:

```rust
use sqlx::SqlitePool;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub enum IdempotencyState {
    /// First time seeing this command_id; proceed.
    New,
    /// Already applied; return the same response.
    Replay { response_json: String, event_ids: Vec<String> },
    /// Same command_id but different payload → error.
    Conflict { original_payload: String },
}

pub async fn check(pool: &SqlitePool, command_id: &str, payload: &str) -> AppResult<IdempotencyState> {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT payload_json, response_json FROM idempotency_keys WHERE command_id = ?"
    ).bind(command_id).fetch_optional(pool).await?;
    if let Some((stored_payload, stored_response)) = row {
        if stored_payload != payload {
            return Ok(IdempotencyState::Conflict { original_payload: stored_payload });
        }
        // Same payload → replay
        let event_ids: Vec<String> = sqlx::query_scalar("SELECT id FROM events WHERE command_id = ?")
            .bind(command_id).fetch_all(pool).await?;
        return Ok(IdempotencyState::Replay { response_json: stored_response, event_ids });
    }
    Ok(IdempotencyState::New)
}

pub async fn record(pool: &SqlitePool, command_id: &str, payload: &str, response: &str) -> AppResult<()> {
    sqlx::query("INSERT OR REPLACE INTO idempotency_keys (command_id, payload_json, response_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
        .bind(command_id).bind(payload).bind(response)
        .execute(pool).await?;
    Ok(())
}
```

Add migration `007_idempotency_keys.sql`:
```sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
  command_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/idempotency.rs || { echo "FAIL"; exit 1; }
grep -q "check" apps/admin/src-tauri/src/commands/idempotency.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
