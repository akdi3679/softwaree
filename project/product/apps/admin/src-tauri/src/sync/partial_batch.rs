use sqlx::SqlitePool;

use crate::error::AppResult;
use crate::events::store::{self, StoredEvent};

/// True if the User's cursor points to a sequence that no longer exists
/// (event log compacted or corrupted). Caller should send a snapshot instead.
pub async fn check_partial_batch(
    pool: &SqlitePool,
    _user_id: &str,
    _device_id: &str,
    last_delivered_seq: i64,
) -> AppResult<bool> {
    let exists: Option<i64> =
        sqlx::query_scalar("SELECT sequence FROM events WHERE sequence = ?")
            .bind(last_delivered_seq)
            .fetch_optional(pool)
            .await?;
    Ok(exists.is_none())
}

/// Resume from a valid cursor — send events after `after_sequence`.
pub async fn resume_from(
    pool: &SqlitePool,
    after_sequence: i64,
    limit: i64,
) -> AppResult<Vec<StoredEvent>> {
    store::read_since(pool, after_sequence, limit).await
}
