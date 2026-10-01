# TASK ID: PERF-002.2
# TITLE: Add projection batch insert (10x faster for User catch-up)
# STATUS: pending
# DEPENDENCIES: PERF-002.1
# ALLOWED FILES: product/apps/user/src-tauri/src/projection/batch_apply.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Apply 1000 events in a single transaction. ~10x faster than 1-by-1.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/projection/batch_apply.rs`:

```rust
use sqlx::{Sqlite, SqlitePool, Transaction};
use crate::error::AppResult;

/// Apply a batch of events in a single transaction.
/// 10x faster than applying 1-by-1 because of fewer fsyncs.
pub async fn apply_batch(pool: &SqlitePool, events: &[Vec<u8>]) -> AppResult<()> {
    let mut tx: Transaction<'_, Sqlite> = pool.begin().await?;
    for ev_json in events {
        // Each event is JSON: {event_type, aggregate_type, aggregate_id, payload: ...}
        let v: serde_json::Value = serde_json::from_slice(ev_json)?;
        let event_type = v.get("event_type").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_type = v.get("aggregate_type").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_id = v.get("aggregate_id").and_then(|x| x.as_str()).unwrap_or("");
        let payload = v.get("payload").cloned().unwrap_or(serde_json::Value::Null);
        let projection_table = format!("projection_{}", aggregate_type);

        // Upsert into projection_<aggregate_type>
        let sql = format!(
            "INSERT INTO {} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) \
             ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            projection_table
        );
        let payload_str = serde_json::to_string(&payload)?;
        sqlx::query(&sql)
            .bind(aggregate_id)
            .bind(&payload_str)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/projection/batch_apply.rs || { echo "FAIL"; exit 1; }
grep -q "apply_batch" apps/user/src-tauri/src/projection/batch_apply.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
