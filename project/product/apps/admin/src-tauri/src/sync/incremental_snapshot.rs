use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotPayload {
    pub project_id: String,
    pub from_sequence: i64,
    pub through_sequence: i64,
    pub events: Vec<Vec<u8>>,
    pub incremental: bool,
    pub approx_size_bytes: usize,
}

/// Build a snapshot containing only events newer than `since_sequence`.
/// Smaller than a full snapshot; caller may fall back to full if too big.
pub async fn build_incremental(
    pool: &SqlitePool,
    project_id: &str,
    since_sequence: i64,
) -> AppResult<SnapshotPayload> {
    let rows: Vec<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, aggregate_type, aggregate_id, payload \
         FROM events WHERE sequence > ? ORDER BY sequence ASC",
    )
    .bind(since_sequence)
    .fetch_all(pool)
    .await?;

    let mut events = Vec::with_capacity(rows.len());
    for (seq, et, at, ai, payload) in &rows {
        let v = serde_json::json!({
            "sequence": seq,
            "event_type": et,
            "aggregate_type": at,
            "aggregate_id": ai,
            "payload": serde_json::from_str::<serde_json::Value>(payload)
                .unwrap_or(serde_json::Value::Null),
        });
        events.push(serde_json::to_vec(&v)?);
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
