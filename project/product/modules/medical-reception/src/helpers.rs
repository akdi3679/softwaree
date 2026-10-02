use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::Value;
use uuid::Uuid;

pub fn parse<T: for<'de> Deserialize<'de>>(payload: &Value) -> ModuleResult<T> {
    serde_json::from_value(payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))
}

pub fn evt(t: &str, agg_t: &str, agg_id: &str, ver: i64, payload: Value) -> Event {
    Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: t.into(),
        aggregate_type: agg_t.into(),
        aggregate_id: agg_id.into(),
        version: ver,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload,
    }
}

pub fn new_id(prefix: &str) -> String {
    format!("{prefix}_{}", Uuid::new_v4())
}
