# TASK ID: ADMIN-006.3
# TITLE: Add change_role and remove_user command handlers
# STATUS: pending
# DEPENDENCIES: ADMIN-006.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/handlers.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add command handlers for changing a user's role and removing a user.

## REQUIRED IMPLEMENTATION

Append to `product/apps/admin/src-tauri/src/commands/handlers.rs`:

```rust
#[derive(Debug, Deserialize)]
pub struct ChangeRoleRequest {
    pub user_id: String,
    pub new_role: String,
}

#[derive(Debug, Serialize)]
pub struct ChangeRoleResult {
    pub user_id: String,
    pub role: String,
}

pub async fn change_role(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    request: ChangeRoleRequest,
) -> AppResult<ChangeRoleResult> {
    crate::authz::engine::require(pool, actor_user_id, "users.manage").await?;

    let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
        .bind(&request.new_role)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::Validation(format!("unknown role: {}", request.new_role)))?;

    let result = engine::execute(
        pool,
        actor_user_id,
        device_id,
        "user.role_changed",
        None,
        {
            let user_id = request.user_id.clone();
            let role_id = role_id.clone();
            let new_role = request.new_role.clone();
            move |tx| {
                let user_id = user_id.clone();
                let role_id = role_id.clone();
                let new_role = new_role.clone();
                async move {
                    // Remove all existing roles
                    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
                        .bind(&user_id)
                        .execute(&mut **tx)
                        .await?;
                    // Add the new role
                    sqlx::query(
                        r#"
                        INSERT INTO user_roles (user_id, role_id, granted_at, granted_by)
                        VALUES (?, ?, ?, ?)
                        "#,
                    )
                    .bind(&user_id)
                    .bind(&role_id)
                    .bind(Utc::now().to_rfc3339())
                    .bind(actor_user_id)
                    .execute(&mut **tx)
                    .await?;
                    Ok((
                        "user".to_string(),
                        user_id,
                        1,
                        json!({ "user_id": user_id, "new_role": new_role }),
                    ))
                }
            }
        },
    )
    .await?;

    Ok(ChangeRoleResult {
        user_id: result.payload["user_id"].as_str().unwrap().to_string(),
        role: result.payload["new_role"].as_str().unwrap().to_string(),
    })
}

#[derive(Debug, Deserialize)]
pub struct RemoveUserRequest {
    pub user_id: String,
    pub reason: String,
}

pub async fn remove_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    request: RemoveUserRequest,
) -> AppResult<()> {
    crate::authz::engine::require(pool, actor_user_id, "users.manage").await?;

    // Don't allow removing the last owner
    let owner_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE r.name = 'admin'
        "#,
    )
    .fetch_one(pool)
    .await?;
    if owner_count <= 1 {
        let is_owner: Option<String> = sqlx::query_scalar(
            r#"
            SELECT ur.user_id FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = ? AND r.name = 'admin'
            "#,
        )
        .bind(&request.user_id)
        .fetch_optional(pool)
        .await?;
        if is_owner.is_some() {
            return Err(AppError::InvalidState(
                "cannot remove the last admin".to_string(),
            ));
        }
    }

    let _ = engine::execute(
        pool,
        actor_user_id,
        device_id,
        "user.removed",
        None,
        {
            let user_id = request.user_id.clone();
            let reason = request.reason.clone();
            move |tx| {
                let user_id = user_id.clone();
                let reason = reason.clone();
                async move {
                    sqlx::query("UPDATE users SET state = 'removed' WHERE id = ?")
                        .bind(&user_id)
                        .execute(&mut **tx)
                        .await?;
                    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
                        .bind(&user_id)
                        .execute(&mut **tx)
                        .await?;
                    Ok((
                        "user".to_string(),
                        user_id,
                        1,
                        json!({ "user_id": user_id, "reason": reason }),
                    ))
                }
            }
        },
    )
    .await?;

    Ok(())
}
```

## TESTS

```bash
cd product
grep -q "fn change_role" apps/admin/src-tauri/src/commands/handlers.rs || { echo "FAIL"; exit 1; }
grep -q "fn remove_user" apps/admin/src-tauri/src/commands/handlers.rs || { echo "FAIL: no remove"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
