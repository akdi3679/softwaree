# TASK ID: ADMIN-007.2
# TITLE: Add sync events router
# STATUS: pending
# DEPENDENCIES: ADMIN-007.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/events.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the events-for-sync router — given a user, return events they can see, applying authorization.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/events.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use crate::events::store::{self, StoredEvent};
use crate::sync::projection;
use crate::error::AppResult;

const SNAPSHOT_THRESHOLD_EVENTS: i64 = 5_000;
const SNAPSHOT_THRESHOLD_DAYS: i64 = 7;

#[derive(Debug, Deserialize)]
pub struct SyncQuery {
    pub user_id: String,
    pub device_id: String,
    pub last_sequence: i64,
    pub max_events: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "mode", rename_all = "snake_case")]
pub enum SyncResponse {
    Events {
        from_sequence: i64,
        to_sequence: i64,
        events: Vec<StoredEvent>,
        has_more: bool,
    },
    Snapshot {
        at_sequence: i64,
        // Real impl: build the authorized projection here
        data: serde_json::Value,
    },
}

/// Get events (or snapshot) for a User.
pub async fn get_events(
    pool: &SqlitePool,
    query: SyncQuery,
) -> AppResult<SyncResponse> {
    let max = query.max_events.unwrap_or(100);

    // Check if a snapshot is needed
    let position = projection::get_position(pool, &query.user_id, &query.device_id).await?;
    let gap = query.last_sequence - position.snapshot_at_sequence.unwrap_or(0);
    let needs_snapshot = gap > SNAPSHOT_THRESHOLD_EVENTS
        || position.snapshot_at
            .map(|s| {
                let snap_time = chrono::DateTime::parse_from_rfc3339(&s).ok();
                let days_ago = snap_time
                    .map(|t| (chrono::Utc::now() - t.with_timezone(&chrono::Utc)).num_days());
                days_ago.unwrap_or(0) > SNAPSHOT_THRESHOLD_DAYS
            })
            .unwrap_or(false);

    if needs_snapshot {
        // Send a snapshot
        let latest = store::latest_sequence(pool).await?;
        projection::record_snapshot(pool, &query.user_id, &query.device_id, latest).await?;
        Ok(SyncResponse::Snapshot {
            at_sequence: latest,
            data: serde_json::json!({ "placeholder": "real projection built in ADMIN-007.3" }),
        })
    } else {
        // Send events
        let events = store::read_since(pool, query.last_sequence, max).await?;
        let to = events.last().map(|e| e.sequence).unwrap_or(query.last_sequence);
        let has_more = events.len() as i64 == max;
        Ok(SyncResponse::Events {
            from_sequence: query.last_sequence,
            to_sequence: to,
            events,
            has_more,
        })
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/events.rs || { echo "FAIL"; exit 1; }
grep -q "SyncResponse" apps/admin/src-tauri/src/sync/events.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
