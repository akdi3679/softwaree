use sqlx::SqlitePool;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub enum IdempotencyState {
    New,
    Replay { response_json: String, event_ids: Vec<String> },
    Conflict { original_payload: String },
}

pub async fn check(pool: &SqlitePool, command_id: &str, payload: &str) -> AppResult<IdempotencyState> {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT payload_json, response_json FROM idempotency_keys WHERE command_id = ?"
    ).bind(command_id).fetch_optional(pool).await?;
    if let Some((stored_payload, stored_response)) = row {
        if stored_payload != payload {
            return Ok(IdempotencyState::Conflict { original_payload: stored_payload });
        }
        let event_ids: Vec<String> = sqlx::query_scalar("SELECT id FROM events WHERE command_id = ?")
            .bind(command_id).fetch_all(pool).await?;
        return Ok(IdempotencyState::Replay { response_json: stored_response, event_ids });
    }
    Ok(IdempotencyState::New)
}

pub async fn record(pool: &SqlitePool, command_id: &str, payload: &str, response: &str) -> AppResult<()> {
    sqlx::query("INSERT OR REPLACE INTO idempotency_keys (command_id, payload_json, response_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
        .bind(command_id).bind(payload).bind(response)
        .execute(pool).await?;
    Ok(())
}
