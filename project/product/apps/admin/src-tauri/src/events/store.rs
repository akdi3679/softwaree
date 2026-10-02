use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredEvent {
    pub sequence: i64,
    pub event_id: String,
    pub event_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub aggregate_version: i64,
    pub actor_user_id: String,
    pub device_id: String,
    pub occurred_at: String,
    pub correlation_id: Option<String>,
    pub causation_id: Option<String>,
    pub payload: Value,
}

pub async fn append(
    pool: &SqlitePool,
    event_id: &str,
    event_type: &str,
    aggregate_type: &str,
    aggregate_id: &str,
    aggregate_version: i64,
    actor_user_id: &str,
    device_id: &str,
    occurred_at: &str,
    payload: &str,
) -> AppResult<i64> {
    let seq: i64 = sqlx::query_scalar(
        r#"
        INSERT INTO events (
            event_id, event_type, aggregate_type, aggregate_id,
            aggregate_version, actor_user_id, device_id, occurred_at, payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING sequence
        "#,
    )
    .bind(event_id)
    .bind(event_type)
    .bind(aggregate_type)
    .bind(aggregate_id)
    .bind(aggregate_version)
    .bind(actor_user_id)
    .bind(device_id)
    .bind(occurred_at)
    .bind(payload)
    .fetch_one(pool)
    .await?;
    Ok(seq)
}

pub async fn read_since(pool: &SqlitePool, since_sequence: i64, limit: i64) -> AppResult<Vec<StoredEvent>> {
    let rows: Vec<(i64, String, String, String, String, i64, String, String, String, Option<String>, Option<String>, String)> = sqlx::query_as(
        r#"
        SELECT sequence, event_id, event_type, aggregate_type, aggregate_id,
               aggregate_version, actor_user_id, device_id, occurred_at,
               correlation_id, causation_id, payload
        FROM events
        WHERE sequence > ?
        ORDER BY sequence ASC
        LIMIT ?
        "#,
    )
    .bind(since_sequence)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(|(sequence, event_id, event_type, aggregate_type, aggregate_id, aggregate_version, actor_user_id, device_id, occurred_at, correlation_id, causation_id, payload)| StoredEvent {
        sequence, event_id, event_type, aggregate_type, aggregate_id,
        aggregate_version, actor_user_id, device_id, occurred_at,
        correlation_id, causation_id,
        payload: serde_json::from_str(&payload).unwrap_or(Value::Null),
    }).collect())
}

pub async fn latest_sequence(pool: &SqlitePool) -> AppResult<i64> {
    let seq: Option<i64> = sqlx::query_scalar("SELECT MAX(sequence) FROM events")
        .fetch_optional(pool).await?;
    Ok(seq.unwrap_or(0))
}
