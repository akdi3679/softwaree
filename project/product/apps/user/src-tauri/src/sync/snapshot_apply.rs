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

/// Apply a snapshot by replaying its events into projection_events.
/// Materialized projections (per-module tables) are derived from there
/// by the owning module's applier.
pub async fn apply_snapshot(pool: &SqlitePool, snap: &SnapshotPayload) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    // For a full (non-incremental) snapshot, clear the event log first.
    if !snap.incremental {
        sqlx::query("DELETE FROM projection_events")
            .execute(&mut *tx)
            .await?;
    }

    for ev_bytes in &snap.events {
        let v: serde_json::Value = serde_json::from_slice(ev_bytes)?;

        let sequence = v.get("sequence").and_then(|x| x.as_i64()).unwrap_or(0);
        let event_id = v.get("event_id").and_then(|x| x.as_str()).unwrap_or("");
        let event_type = v.get("event_type").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_type = v.get("aggregate_type").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_id = v.get("aggregate_id").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_version = v.get("aggregate_version").and_then(|x| x.as_i64()).unwrap_or(0);
        let actor_user_id = v.get("actor_user_id").and_then(|x| x.as_str()).unwrap_or("");
        let device_id = v.get("device_id").and_then(|x| x.as_str()).unwrap_or("");
        let correlation_id = v.get("correlation_id").and_then(|x| x.as_str());
        let causation_id = v.get("causation_id").and_then(|x| x.as_str());
        let payload = v
            .get("payload")
            .cloned()
            .unwrap_or(serde_json::Value::Null);
        let payload_str = serde_json::to_string(&payload)?;

        if event_id.is_empty() {
            continue;
        }

        sqlx::query(
            "INSERT OR REPLACE INTO projection_events \
             (sequence, event_id, event_type, aggregate_type, aggregate_id, \
              aggregate_version, actor_user_id, device_id, correlation_id, \
              causation_id, payload, applied_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        )
        .bind(sequence)
        .bind(event_id)
        .bind(event_type)
        .bind(aggregate_type)
        .bind(aggregate_id)
        .bind(aggregate_version)
        .bind(actor_user_id)
        .bind(device_id)
        .bind(correlation_id)
        .bind(causation_id)
        .bind(&payload_str)
        .execute(&mut *tx)
        .await?;
    }

    // Advance the cursor to the snapshot's through_sequence.
    sqlx::query(
        "INSERT INTO projection_state \
         (project_id, admin_endpoint, last_applied_sequence, updated_at) \
         VALUES (?, '', ?, CURRENT_TIMESTAMP) \
         ON CONFLICT(project_id) DO UPDATE SET \
           last_applied_sequence = MAX(last_applied_sequence, excluded.last_applied_sequence), \
           updated_at = CURRENT_TIMESTAMP",
    )
    .bind(&snap.project_id)
    .bind(snap.through_sequence)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub fn needs_snapshot(missing: i64, oldest_unapplied_age_secs: i64) -> bool {
    const SEQUENCE_THRESHOLD: i64 = 5000;
    const AGE_THRESHOLD_SECS: i64 = 7 * 24 * 60 * 60;
    missing > SEQUENCE_THRESHOLD || oldest_unapplied_age_secs > AGE_THRESHOLD_SECS
}
