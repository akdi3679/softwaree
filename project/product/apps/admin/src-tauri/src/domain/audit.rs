use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: i64,
    pub occurred_at: DateTime<Utc>,
    pub actor_user_id: Option<String>,
    pub actor_device_id: Option<String>,
    pub action: String,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub result: String,
    pub details: Option<serde_json::Value>,
}
