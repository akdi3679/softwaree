# TASK ID: ADMIN-007.3
# TITLE: Add projection builder
# STATUS: pending
# DEPENDENCIES: ADMIN-007.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/builder.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Build the authorized projection for a User — the data they can see at a given sequence.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/builder.rs`:

```rust
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::authz::engine;
use crate::error::AppResult;

#[derive(Debug)]
pub struct Projection {
    pub at_sequence: i64,
    pub users: Vec<Value>,
    pub roles: Vec<Value>,
    pub audit_tail: Vec<Value>,
    pub modules: Vec<Value>,
}

/// Build the authorized projection for a user.
pub async fn build_for_user(
    pool: &SqlitePool,
    user_id: &str,
    _device_id: &str,
    at_sequence: i64,
) -> AppResult<Projection> {
    // Verify the user can read users
    let can_read_users = engine::can(pool, user_id, "users.read").await
        .unwrap_or(false);

    // Users (if authorized)
    let users = if can_read_users {
        let rows: Vec<(String, String, String, String, String)> = sqlx::query_as(
            r#"
            SELECT id, email, display_name, state, created_at
            FROM users
            WHERE state != 'removed'
            "#,
        )
        .fetch_all(pool)
        .await?;
        rows.into_iter()
            .map(|(id, email, display_name, state, created_at)| json!({
                "id": id, "email": email, "display_name": display_name,
                "state": state, "created_at": created_at,
            }))
            .collect()
    } else {
        vec![]
    };

    // Roles (everyone can see the role catalog)
    let role_rows: Vec<(String, String, String, i64)> = sqlx::query_as(
        r#"
        SELECT id, name, display_name, is_built_in FROM roles
        "#,
    )
    .fetch_all(pool)
    .await?;
    let roles: Vec<Value> = role_rows
        .into_iter()
        .map(|(id, name, display_name, is_built_in)| {
            json!({
                "id": id, "name": name, "display_name": display_name,
                "is_built_in": is_built_in != 0,
            })
        })
        .collect();

    // Audit tail (last 100 entries, if authorized)
    let can_read_audit = engine::can(pool, user_id, "audit.read").await.unwrap_or(false);
    let audit_tail = if can_read_audit {
        let rows: Vec<(i64, String, Option<String>, String, Option<String>, Option<String>, String, String)> = sqlx::query_as(
            r#"
            SELECT id, occurred_at, actor_user_id, action, target_type, target_id, result, details
            FROM audit_entries
            ORDER BY id DESC
            LIMIT 100
            "#,
        )
        .fetch_all(pool)
        .await?;
        rows.into_iter()
            .map(|(id, occurred_at, actor, action, target_type, target_id, result, details)| {
                json!({
                    "id": id, "occurred_at": occurred_at, "actor_user_id": actor,
                    "action": action, "target_type": target_type, "target_id": target_id,
                    "result": result, "details": details,
                })
            })
            .collect()
    } else {
        vec![]
    };

    // Modules (everyone can see installed modules)
    let module_rows: Vec<(String, String, String, i64)> = sqlx::query_as(
        r#"
        SELECT module_id, name, version, state
        FROM module_registry
        "#,
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();
    let modules: Vec<Value> = module_rows
        .into_iter()
        .map(|(module_id, name, version, state)| {
            json!({
                "module_id": module_id, "name": name, "version": version, "state": state,
            })
        })
        .collect();

    Ok(Projection {
        at_sequence,
        users,
        roles,
        audit_tail,
        modules,
    })
}
```

Note: this requires a `module_registry` table, added in ADMIN-010.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/builder.rs || { echo "FAIL"; exit 1; }
grep -q "build_for_user" apps/admin/src-tauri/src/sync/builder.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
