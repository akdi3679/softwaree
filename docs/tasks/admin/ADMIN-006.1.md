# TASK ID: ADMIN-006.1
# TITLE: Add authorization engine
# STATUS: pending
# DEPENDENCIES: ADMIN-005.10
# ALLOWED FILES: product/apps/admin/src-tauri/src/authz/engine.rs, product/apps/admin/src-tauri/src/authz/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the authorization engine — check if a user has a permission for an action.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/authz/mod.rs`:

```rust
pub mod engine;
```

Create `product/apps/admin/src-tauri/src/authz/engine.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::{AppError, AppResult};

/// Check if a user has a permission, considering all their roles.
/// Wildcard "*" matches any permission.
pub async fn can(
    pool: &SqlitePool,
    user_id: &str,
    permission: &str,
) -> AppResult<bool> {
    // Direct permission check
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
          AND (rp.permission = ? OR rp.permission = '*')
        "#,
    )
    .bind(user_id)
    .bind(permission)
    .fetch_one(pool)
    .await?;

    Ok(count > 0)
}

/// Check and return an error if not authorized.
pub async fn require(pool: &SqlitePool, user_id: &str, permission: &str) -> AppResult<()> {
    if can(pool, user_id, permission).await? {
        Ok(())
    } else {
        Err(AppError::PermissionDenied(format!(
            "user {user_id} missing permission {permission}"
        )))
    }
}

/// List all permissions for a user (for UI).
pub async fn list_user_permissions(pool: &SqlitePool, user_id: &str) -> AppResult<Vec<String>> {
    let rows: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT DISTINCT rp.permission
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|(p,)| p).collect())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/authz/engine.rs || { echo "FAIL"; exit 1; }
grep -q "fn can" apps/admin/src-tauri/src/authz/engine.rs || { echo "FAIL"; exit 1; }
grep -q "fn require" apps/admin/src-tauri/src/authz/engine.rs || { echo "FAIL: no require"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
