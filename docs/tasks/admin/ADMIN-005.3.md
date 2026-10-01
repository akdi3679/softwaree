# TASK ID: ADMIN-005.3
# TITLE: Add built-in role seeding on project creation
# STATUS: pending
# DEPENDENCIES: ADMIN-005.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/domain/audit.rs, product/apps/admin/src-tauri/src/db/seed_roles.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Seed built-in roles + permissions when a new project database is created.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/domain/audit.rs`:

```rust
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
```

Create `product/apps/admin/src-tauri/src/db/seed_roles.rs`:

```rust
use sqlx::SqlitePool;
use crate::domain::role::built_in;
use crate::error::AppResult;
use chrono::Utc;
use uuid::Uuid;

pub async fn seed_roles(pool: &SqlitePool) -> AppResult<()> {
    for name in built_in::ALL {
        let id = Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO roles (id, name, display_name, is_built_in, created_at)
            VALUES (?, ?, ?, 1, ?)
            "#,
        )
        .bind(&id)
        .bind(name)
        .bind(display_name_for(name))
        .bind(Utc::now().to_rfc3339())
        .execute(pool)
        .await?;

        // Insert default permissions
        for perm in built_in::default_permissions(name) {
            let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
                .bind(name)
                .fetch_one(pool)
                .await?;
            sqlx::query(
                r#"
                INSERT OR IGNORE INTO role_permissions (role_id, permission, granted_at)
                VALUES (?, ?, ?)
                "#,
            )
            .bind(&role_id)
            .bind(perm)
            .bind(Utc::now().to_rfc3339())
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

fn display_name_for(role: &str) -> &'static str {
    match role {
        built_in::ADMIN => "Administrator",
        built_in::DOCTOR => "Doctor",
        built_in::RECEPTIONIST => "Receptionist",
        built_in::LAB_TECH => "Lab Technician",
        _ => "Unknown",
    }
}
```

Update `product/apps/admin/src-tauri/src/db/mod.rs`:

```rust
pub mod migrations;
pub mod pool;
pub mod project_db;
pub mod seed_roles;
```

Update `product/apps/admin/src-tauri/src/db/migrations.rs` to call `seed_roles` after migrations:

```rust
use sqlx::SqlitePool;
use crate::db::seed_roles;
use crate::error::AppResult;

pub async fn run(pool: &SqlitePool) -> AppResult<()> {
    // ... existing migration code ...
    seed_roles::seed_roles(pool).await?;
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/db/seed_roles.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/domain/audit.rs || { echo "FAIL: no audit"; exit 1; }
grep -q "seed_roles" apps/admin/src-tauri/src/db/migrations.rs || { echo "FAIL: not wired"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
