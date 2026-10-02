use sqlx::SqlitePool;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub struct CacheStats { pub total_events: i64, pub last_event_at: Option<String>, pub last_sync_at: Option<String>, pub oldest_event_at: Option<String>, pub projection_size_bytes: i64 }

pub async fn stats(pool: &SqlitePool) -> AppResult<CacheStats> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events_log").fetch_one(pool).await?;
    let last_at: Option<String> = sqlx::query_scalar("SELECT MAX(occurred_at) FROM events_log").fetch_one(pool).await.ok();
    let last_sync: Option<String> = sqlx::query_scalar("SELECT last_sync_at FROM sync_state WHERE id = 1").fetch_one(pool).await.ok();
    let oldest: Option<String> = sqlx::query_scalar("SELECT MIN(occurred_at) FROM events_log").fetch_one(pool).await.ok();
    let page_count: i64 = sqlx::query_scalar("SELECT page_count FROM pragma_page_count()").fetch_one(pool).await.unwrap_or(0);
    Ok(CacheStats { total_events: total, last_event_at: last_at, last_sync_at: last_sync, oldest_event_at: oldest, projection_size_bytes: page_count * 4096 })
}
