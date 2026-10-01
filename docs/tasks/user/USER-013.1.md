# TASK ID: USER-013.1
# TITLE: Add User: offline-first projection cache
# STATUS: pending
# DEPENDENCIES: ADMIN-021.2
# ALLOWED FILES: product/apps/user/src-tauri/src/projection/offline_cache.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can browse the projection even with zero connectivity.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/projection/offline_cache.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;
use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(Serialize)]
pub struct CacheStats {
    pub total_events: i64,
    pub last_event_at: Option<String>,
    pub last_sync_at: Option<String>,
    pub oldest_event_at: Option<String>,
    pub projection_size_bytes: i64,
}

pub async fn stats(pool: &SqlitePool) -> AppResult<CacheStats> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events_log").fetch_one(pool).await?;
    let last_at: Option<String> = sqlx::query_scalar("SELECT MAX(occurred_at) FROM events_log").fetch_one(pool).await.ok();
    let last_sync: Option<String> = sqlx::query_scalar("SELECT last_sync_at FROM sync_state WHERE id = 1").fetch_one(pool).await.ok();
    let oldest: Option<String> = sqlx::query_scalar("SELECT MIN(occurred_at) FROM events_log").fetch_one(pool).await.ok();
    let page_count: i64 = sqlx::query_scalar("SELECT page_count FROM pragma_page_count()").fetch_one(pool).await.unwrap_or(0);
    Ok(CacheStats {
        total_events: total,
        last_event_at: last_at,
        last_sync_at: last_sync,
        oldest_event_at: oldest,
        projection_size_bytes: page_count * 4096,
    })
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/projection/offline_cache.rs || { echo "FAIL"; exit 1; }
grep -q "CacheStats" apps/user/src-tauri/src/projection/offline_cache.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
