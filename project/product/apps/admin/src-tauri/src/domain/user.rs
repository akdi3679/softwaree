use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub display_name: String,
    pub state: UserState,
    pub created_at: DateTime<Utc>,
    pub roles: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserState {
    PendingInvitation,
    PendingApproval,
    Active,
    Suspended,
    Removed,
}

impl UserState {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::PendingInvitation => "pending_invitation",
            Self::PendingApproval => "pending_approval",
            Self::Active => "active",
            Self::Suspended => "suspended",
            Self::Removed => "removed",
        }
    }
}
