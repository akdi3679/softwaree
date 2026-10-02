use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Plan {
    Local,
    Starter,
    Team,
    Enterprise,
}

impl Plan {
    pub fn from_str(s: &str) -> Plan {
        match s {
            "starter" => Plan::Starter,
            "team" => Plan::Team,
            "enterprise" => Plan::Enterprise,
            _ => Plan::Local,
        }
    }

    pub fn max_users(&self) -> Option<u32> {
        match self {
            Plan::Local => Some(0),
            Plan::Starter => Some(3),
            Plan::Team => Some(10),
            Plan::Enterprise => None,
        }
    }

    pub fn max_projects(&self) -> Option<u32> {
        match self {
            Plan::Local => Some(1),
            Plan::Starter => Some(1),
            Plan::Team => Some(1),
            Plan::Enterprise => None,
        }
    }

    pub fn backup_enabled(&self) -> bool {
        !matches!(self, Plan::Local)
    }

    pub fn backup_cadence_hours(&self) -> Option<u32> {
        match self {
            Plan::Local => None,
            Plan::Starter | Plan::Team => Some(24),
            Plan::Enterprise => Some(24),
        }
    }

    pub fn can_install_custom_modules(&self) -> bool {
        matches!(self, Plan::Enterprise)
    }
}

pub async fn check_can_add_user(pool: &sqlx::SqlitePool, plan: Plan) -> AppResult<()> {
    let Some(max) = plan.max_users() else {
        return Ok(());
    };
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE state = 'active'")
        .fetch_one(pool)
        .await?;
    if (count as u32) >= max {
        return Err(AppError::Conflict(format!(
            "plan {:?} allows max {} users; you have {}. Upgrade your plan.",
            plan, max, count
        )));
    }
    Ok(())
}

pub async fn check_can_add_project(state_dir: &std::path::Path, plan: Plan) -> AppResult<()> {
    let Some(max) = plan.max_projects() else {
        return Ok(());
    };
    let count = std::fs::read_dir(state_dir)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .count() as u32;
    if count >= max {
        return Err(AppError::Conflict(format!(
            "plan {:?} allows max {} projects; you have {}. Upgrade your plan.",
            plan, max, count
        )));
    }
    Ok(())
}
