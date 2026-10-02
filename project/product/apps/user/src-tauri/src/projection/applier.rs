use chrono::Utc;
use serde_json::Value;
use sqlx::SqlitePool;

use crate::db::projection_db::ProjectionDb;
use crate::error::AppResult;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WireEvent {
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

pub async fn apply_batch(db: &ProjectionDb, events: &[WireEvent]) -> AppResult<i64> {
    let mut tx = db.pool.begin().await?;
    let mut last = db.get_position().await?;
    let now = Utc::now().to_rfc3339();

    for event in events {
        let exists: Option<i64> = sqlx::query_scalar(
            "SELECT sequence FROM projection_events WHERE sequence = ?",
        )
        .bind(event.sequence)
        .fetch_optional(&mut *tx)
        .await?;
        if exists.is_some() {
            continue;
        }

        sqlx::query(
            r#"
            INSERT INTO projection_events (
                sequence, event_id, event_type, aggregate_type, aggregate_id,
                aggregate_version, actor_user_id, device_id, occurred_at,
                correlation_id, causation_id, payload, applied_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(event.sequence)
        .bind(&event.event_id)
        .bind(&event.event_type)
        .bind(&event.aggregate_type)
        .bind(&event.aggregate_id)
        .bind(event.aggregate_version)
        .bind(&event.actor_user_id)
        .bind(&event.device_id)
        .bind(&event.occurred_at)
        .bind(&event.correlation_id)
        .bind(&event.causation_id)
        .bind(serde_json::to_string(&event.payload)?)
        .bind(&now)
        .execute(&mut *tx)
        .await?;

        apply_to_projection(&mut tx, event).await?;
        last = event.sequence;
    }

    sqlx::query(
        r#"
        INSERT INTO projection_state (project_id, admin_endpoint, last_applied_sequence, updated_at)
        VALUES (?, '', ?, ?)
        ON CONFLICT (project_id) DO UPDATE
        SET last_applied_sequence = MAX(last_applied_sequence, excluded.last_applied_sequence),
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&db.project_id)
    .bind(last)
    .bind(&now)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(last)
}

async fn apply_to_projection(tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>, event: &WireEvent) -> AppResult<()> {
    match (event.aggregate_type.as_str(), event.event_type.as_str()) {
        ("user", "user.created") | ("user", "user.role_changed") | ("user", "user.removed") => {
            let email = event.payload["email"].as_str().unwrap_or_default();
            let display_name = event.payload["display_name"].as_str().unwrap_or_default();
            let state = match event.event_type.as_str() {
                "user.removed" => "removed",
                _ => "active",
            };
            sqlx::query(
                r#"
                INSERT INTO projection_users (id, email, display_name, state, created_at, last_event_sequence)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                    email = excluded.email,
                    display_name = excluded.display_name,
                    state = excluded.state,
                    last_event_sequence = excluded.last_event_sequence,
                    tombstoned_at = CASE WHEN excluded.state = 'removed' THEN ? ELSE NULL END
                "#,
            )
            .bind(&event.aggregate_id)
            .bind(email)
            .bind(display_name)
            .bind(state)
            .bind(&event.occurred_at)
            .bind(event.sequence)
            .bind(event.occurred_at.clone())
            .execute(&mut **tx)
            .await?;
        }
        _ => {}
    }
    Ok(())
}
