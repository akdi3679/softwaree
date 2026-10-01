# TASK ID: ADMIN-006.2
# TITLE: Add create_user command handler
# STATUS: pending
# DEPENDENCIES: ADMIN-006.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/handlers.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the create_user command — Admin creates a user from an accepted invitation.

## REQUIRED IMPLEMENTATION

Append to `product/apps/admin/src-tauri/src/commands/handlers.rs`:

```rust
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub display_name: String,
    pub initial_role: String,
}

#[derive(Debug, Serialize)]
pub struct CreateUserResult {
    pub user_id: String,
}

pub async fn create_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    request: CreateUserRequest,
) -> AppResult<CreateUserResult> {
    // Authorize
    crate::authz::engine::require(pool, actor_user_id, "users.manage").await?;

    // Check email uniqueness
    let existing: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&request.email)
        .fetch_optional(pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::Conflict(format!(
            "email already exists: {}",
            request.email
        )));
    }

    let user_id = format!("usr_{}", uuid_v7_like());

    let result = engine::execute(
        pool,
        actor_user_id,
        device_id,
        "user.created",
        None,
        {
            let user_id = user_id.clone();
            let email = request.email.clone();
            let display_name = request.display_name.clone();
            let role = request.initial_role.clone();
            move |tx| {
                let user_id = user_id.clone();
                let email = email.clone();
                let display_name = display_name.clone();
                let role = role.clone();
                async move {
                    sqlx::query(
                        r#"
                        INSERT INTO users (id, email, display_name, state, created_at)
                        VALUES (?, ?, ?, 'active', ?)
                        "#,
                    )
                    .bind(&user_id)
                    .bind(&email)
                    .bind(&display_name)
                    .bind(Utc::now().to_rfc3339())
                    .execute(&mut **tx)
                    .await?;

                    let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
                        .bind(&role)
                        .fetch_one(&mut **tx)
                        .await?;
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
                        json!({ "user_id": user_id, "email": email, "role": role }),
                    ))
                }
            }
        },
    )
    .await?;

    Ok(CreateUserResult { user_id: result.payload["user_id"].as_str().unwrap().to_string() })
}
```

## TESTS

```bash
cd product
grep -q "fn create_user" apps/admin/src-tauri/src/commands/handlers.rs || { echo "FAIL"; exit 1; }
grep -q "authz::engine::require" apps/admin/src-tauri/src/commands/handlers.rs || { echo "FAIL: no authz"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
