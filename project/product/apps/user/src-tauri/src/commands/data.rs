use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[tauri::command]
pub async fn list_projection(state: State<'_, AppState>, table: String) -> AppResult<serde_json::Value> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| AppError::NotFound("no active projection".into()))?;
    let rows: Vec<serde_json::Value> = match table.as_str() {
        "users" => {
            sqlx::query_as::<_, (String, String, String, String)>(
                "SELECT id, email, display_name, state FROM projection_users WHERE state != 'removed'"
            )
            .fetch_all(&proj.pool).await?
            .into_iter().map(|(id, email, display_name, state)| serde_json::json!({ "id": id, "email": email, "display_name": display_name, "state": state })).collect()
        }
        "audit" => {
            sqlx::query_as::<_, (i64, String, Option<String>, String, String)>(
                "SELECT id, occurred_at, actor_user_id, action, result FROM projection_audit ORDER BY id DESC LIMIT 100"
            )
            .fetch_all(&proj.pool).await?
            .into_iter().map(|(id, occurred_at, actor_user_id, action, result)| serde_json::json!({ "id": id, "occurred_at": occurred_at, "actor_user_id": actor_user_id, "action": action, "result": result })).collect()
        }
        _ => return Err(AppError::Validation(format!("unknown table: {table}"))),
    };
    Ok(serde_json::json!({ "rows": rows }))
}

#[tauri::command]
pub async fn query_event_log(state: State<'_, AppState>, from_sequence: i64, limit: i64) -> AppResult<serde_json::Value> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| AppError::NotFound("no active projection".into()))?;
    let rows = sqlx::query_as::<_, (i64, String, String, String, String, String, String)>(
        "SELECT sequence, event_type, aggregate_type, aggregate_id, occurred_at, actor_user_id, payload FROM projection_events WHERE sequence > ? ORDER BY sequence ASC LIMIT ?"
    )
    .bind(from_sequence).bind(limit).fetch_all(&proj.pool).await?;
    let events: Vec<serde_json::Value> = rows.into_iter().map(|(seq, etype, atype, aid, time, actor, payload)| serde_json::json!({
        "sequence": seq, "event_type": etype, "aggregate_type": atype, "aggregate_id": aid, "occurred_at": time, "actor_user_id": actor, "payload": payload
    })).collect();
    Ok(serde_json::json!({ "events": events }))
}

#[tauri::command]
pub async fn query_domain(state: State<'_, AppState>, aggregate: String) -> AppResult<Vec<serde_json::Value>> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| AppError::NotFound("no active projection".into()))?;
    let table = match aggregate.as_str() {
        "patient" => "projection_patients",
        "appointment" => "projection_appointments",
        "sample" => "projection_samples",
        "visit" => "projection_visits",
        _ => return Err(AppError::Validation(format!("unknown aggregate: {aggregate}"))),
    };
    let sql = format!(
        "SELECT id, data FROM {} ORDER BY last_event_sequence DESC LIMIT 1000",
        table
    );
    let rows: Vec<(String, String)> = sqlx::query_as(&sql).fetch_all(&proj.pool).await?;
    Ok(rows
        .into_iter()
        .map(|(id, data)| {
            let parsed: serde_json::Value =
                serde_json::from_str(&data).unwrap_or(serde_json::Value::Null);
            serde_json::json!({ "id": id, "data": parsed })
        })
        .collect())
}
