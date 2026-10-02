use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub version: i64,
    pub occurred_at: String,
    pub payload: Value,
}
