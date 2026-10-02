use crate::error::AppResult;
use serde_json::Value;

pub fn validate(event: &Value) -> AppResult<()> {
    let obj = event.as_object().ok_or_else(|| crate::error::AppError::Validation("event must be an object".into()))?;
    for field in &["id", "event_type", "aggregate_type", "aggregate_id", "version", "occurred_at", "actor_id", "device_id", "command_id", "idempotency_key", "payload"] {
        if !obj.contains_key(*field) {
            return Err(crate::error::AppError::Validation(format!("missing field: {field}")));
        }
    }
    if let Some(id) = obj.get("id").and_then(|v| v.as_str()) {
        if !id.starts_with("evt_") { return Err(crate::error::AppError::Validation("id must start with evt_".into())); }
    }
    Ok(())
}
