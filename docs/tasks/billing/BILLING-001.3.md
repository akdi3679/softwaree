# TASK ID: BILLING-001.3
# TITLE: Add Admin plan enforcement (limit users based on plan)
# STATUS: pending
# DEPENDENCIES: BILLING-001.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/billing/enforce.rs, product/apps/admin/src-tauri/src/commands/billing.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Enforce plan limits on the Admin side: max users, max projects, backup cadence.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/billing/enforce.rs`:

```rust
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
    pub fn max_users(&self) -> Option<u32> {
        match self {
            Plan::Local => Some(0),
            Plan::Starter => Some(3),
            Plan::Team => Some(10),
            Plan::Enterprise => None, // unlimited
        }
    }
    pub fn max_projects(&self) -> Option<u32> {
        match self {
            Plan::Local => Some(1),
            Plan::Starter => Some(5),
            Plan::Team => Some(20),
            Plan::Enterprise => None,
        }
    }
    pub fn backup_cadence_hours(&self) -> Option<u32> {
        match self {
            Plan::Local => None,  // no backup
            Plan::Starter | Plan::Team => Some(24), // daily
            Plan::Enterprise => None, // manual
        }
    }
    pub fn can_install_third_party_modules(&self) -> bool {
        matches!(self, Plan::Team | Plan::Enterprise)
    }
    pub fn can_have_custom_modules(&self) -> bool {
        matches!(self, Plan::Enterprise)
    }
}

pub async fn check_can_add_user(pool: &sqlx::SqlitePool, plan: Plan) -> AppResult<()> {
    let max = plan.max_users().ok_or_else(|| AppError::PermissionDenied("plan has no user limit but check is being called".into()))?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE state = 'active'")
        .fetch_one(pool).await?;
    if (count as u32) >= max {
        return Err(AppError::Conflict(format!("plan {:?} allows max {} users; you have {}. Upgrade your plan.", plan, max, count)));
    }
    Ok(())
}

pub async fn check_can_add_project(state_dir: &std::path::Path, plan: Plan) -> AppResult<()> {
    let max = plan.max_projects().ok_or_else(|| AppError::PermissionDenied("plan has no project limit but check is being called".into()))?;
    let count = std::fs::read_dir(state_dir)?.filter_map(|e| e.ok()).count() as u32;
    if count >= max {
        return Err(AppError::Conflict(format!("plan {:?} allows max {} projects; you have {}. Upgrade your plan.", plan, max, count)));
    }
    Ok(())
}
```

Wire into `create_user` and `create_project` commands.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/billing/enforce.rs || { echo "FAIL"; exit 1; }
grep -q "max_users" apps/admin/src-tauri/src/billing/enforce.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
