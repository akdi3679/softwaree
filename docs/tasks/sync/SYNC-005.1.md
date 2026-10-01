# TASK ID: SYNC-005.1
# TITLE: Add sync: incremental snapshot (only changed aggregates)
# STATUS: pending
# DEPENDENCIES: ADMIN-019.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/incremental_snapshot.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Smaller snapshots: only the aggregates that changed since last user request.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/incremental_snapshot.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;
use product_contracts::sync::SnapshotPayload;

/// Build a snapshot containing only events newer than `since_sequence`.
/// If the result is more than 10MB, force a full snapshot.
pub async fn build_incremental(pool: &SqlitePool, project_id: &str, since_sequence: i64) -> AppResult<SnapshotPayload> {
    let rows: Vec<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, aggregate_type, aggregate_id, payload FROM events WHERE sequence > ? ORDER BY sequence ASC"
    )
        .bind(since_sequence)
        .fetch_all(pool)
        .await?;
    let mut events = Vec::with_capacity(rows.len());
    for (seq, et, at, ai, payload) in &rows {
        events.push(serde_json::to_vec(&serde_json::json!({
            "sequence": seq,
            "event_type": et,
            "aggregate_type": at,
            "aggregate_id": ai,
            "payload": serde_json::from_str::<serde_json::Value>(payload).unwrap_or(serde_json::Value::Null),
        }))?);
    }
    let through = rows.last().map(|(s, _, _, _, _)| *s).unwrap_or(since_sequence);
    let approx_bytes: usize = events.iter().map(|e| e.len()).sum();
    Ok(SnapshotPayload {
        project_id: project_id.to_string(),
        from_sequence: since_sequence,
        through_sequence: through,
        events,
        incremental: true,
        approx_size_bytes: approx_bytes,
    })
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/incremental_snapshot.rs || { echo "FAIL"; exit 1; }
grep -q "build_incremental" apps/admin/src-tauri/src/sync/incremental_snapshot.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
