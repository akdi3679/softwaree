# TASK ID: SYNC-002.2
# TITLE: Add sync partial-batch handling
# STATUS: pending
# DEPENDENCIES: SYNC-002.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/partial_batch.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When a User's sync is interrupted mid-batch, resume from the last delivered sequence.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/partial_batch.rs`:

```rust
use crate::events::store;
use crate::error::AppResult;
use sqlx::SqlitePool;

/// Check if a User's cursor points to an event that has been compacted/deleted.
/// If so, return a snapshot recommendation.
pub async fn check_partial_batch(pool: &SqlitePool, user_id: &str, device_id: &str, last_delivered_seq: i64) -> AppResult<bool> {
    // If the local DB has no event with that sequence, the User's cursor is invalid
    let exists: Option<i64> = sqlx::query_scalar("SELECT sequence FROM events WHERE sequence = ?")
        .bind(last_delivered_seq)
        .fetch_optional(pool)
        .await?;
    Ok(exists.is_none())
}

/// Resume: send events after the last delivered sequence.
pub async fn resume_from(pool: &SqlitePool, after_sequence: i64, limit: i64) -> AppResult<Vec<store::StoredEvent>> {
    store::read_since(pool, after_sequence, limit).await
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/partial_batch.rs || { echo "FAIL"; exit 1; }
grep -q "check_partial_batch" apps/admin/src-tauri/src/sync/partial_batch.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
