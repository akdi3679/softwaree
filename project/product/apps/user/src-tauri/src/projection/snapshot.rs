use serde_json::Value;
use sqlx::SqlitePool;

use crate::db::projection_db::ProjectionDb;
use crate::error::AppResult;

pub async fn apply(db: &ProjectionDb, snapshot: &Value) -> AppResult<()> {
    let mut tx = db.pool.begin().await?;

    sqlx::query("DELETE FROM projection_users").execute(&mut *tx).await?;
    if let Some(users) = snapshot.get("users").and_then(|v| v.as_array()) {
        for u in users {
            let id = u.get("id").and_then(|v| v.as_str()).unwrap_or_default();
            let email = u.get("email").and_then(|v| v.as_str()).unwrap_or_default();
            let display_name = u.get("display_name").and_then(|v| v.as_str()).unwrap_or_default();
            let state = u.get("state").and_then(|v| v.as_str()).unwrap_or("active");
            let created_at = u.get("created_at").and_then(|v| v.as_str()).unwrap_or_default();
            sqlx::query("INSERT INTO projection_users (id, email, display_name, state, created_at, last_event_sequence) VALUES (?, ?, ?, ?, ?, 0)")
                .bind(id).bind(email).bind(display_name).bind(state).bind(created_at)
                .execute(&mut *tx).await?;
        }
    }

    sqlx::query("DELETE FROM projection_audit").execute(&mut *tx).await?;
    if let Some(entries) = snapshot.get("audit_tail").and_then(|v| v.as_array()) {
        for entry in entries {
            let occurred_at = entry.get("occurred_at").and_then(|v| v.as_str()).unwrap_or_default();
            let actor = entry.get("actor_user_id").and_then(|v| v.as_str());
            let action = entry.get("action").and_then(|v| v.as_str()).unwrap_or_default();
            let result = entry.get("result").and_then(|v| v.as_str()).unwrap_or("success");
            let target_type = entry.get("target_type").and_then(|v| v.as_str());
            let target_id = entry.get("target_id").and_then(|v| v.as_str());
            let details = entry.get("details").map(|v| v.to_string());
            sqlx::query("INSERT INTO projection_audit (occurred_at, actor_user_id, action, target_type, target_id, result, details) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .bind(occurred_at).bind(actor).bind(action).bind(target_type).bind(target_id).bind(result).bind(details)
                .execute(&mut *tx).await?;
        }
    }

    tx.commit().await?;
    Ok(())
}
