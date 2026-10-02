use crate::event::Event;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub id: String,
    pub command_type: String,
    #[serde(default)]
    pub aggregate_type: String,
    #[serde(default)]
    pub aggregate_id: String,
    #[serde(default)]
    pub actor_user_id: String,
    #[serde(default)]
    pub device_id: String,
    #[serde(default)]
    pub correlation_id: Option<String>,
    pub payload: Value,
    #[serde(default)]
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandOutcome {
    pub events: Vec<Event>,
    pub response: Value,
}
