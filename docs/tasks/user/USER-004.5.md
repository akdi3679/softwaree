# TASK ID: USER-004.5
# TITLE: Add User gap detection (request snapshot when events missed)
# STATUS: pending
# DEPENDENCIES: USER-004.4
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/gap.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Detect a gap in the event stream and request a snapshot instead of trying to backfill.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/gap.rs`:

```rust
use crate::db::projection_db::ProjectionDb;
use crate::error::AppResult;

const GAP_THRESHOLD: i64 = 5_000;
const SNAPSHOT_AGE_DAYS: i64 = 7;

/// Check if the incoming `first_sequence` is too far ahead of the local position.
/// Returns true if a snapshot is needed.
pub async fn needs_snapshot(db: &ProjectionDb, first_sequence: i64) -> AppResult<bool> {
    let local = db.get_position().await?;
    let gap = first_sequence - local;
    if gap > GAP_THRESHOLD {
        return Ok(true);
    }
    // Check snapshot age
    let snap_at: Option<(Option<String>,)> = sqlx::query_as(
        "SELECT snapshot_at FROM projection_state WHERE project_id = ?",
    )
    .bind(&db.project_id)
    .fetch_optional(&db.pool)
    .await?;
    if let Some((Some(s),)) = snap_at {
        if let Ok(t) = chrono::DateTime::parse_from_rfc3339(&s) {
            let days = (chrono::Utc::now() - t.with_timezone(&chrono::Utc)).num_days();
            if days > SNAPSHOT_AGE_DAYS {
                return Ok(true);
            }
        }
    }
    Ok(false)
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/gap.rs || { echo "FAIL"; exit 1; }
grep -q "GAP_THRESHOLD" apps/user/src-tauri/src/sync/gap.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
