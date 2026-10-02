use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use chrono::Utc;

use crate::authz;
use crate::error::{AppError, AppResult};

fn uuid_simple() -> String {
    uuid::Uuid::new_v4().simple().to_string()
}

#[derive(Debug, Deserialize)]
pub struct InviteUserRequest {
    pub email: String,
    pub initial_role: String,
}

#[derive(Debug, Serialize)]
pub struct InviteUserResult {
    pub invitation_id: String,
    pub token: String,
    pub expires_at: String,
}

pub async fn invite_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    _device_id: &str,
    request: InviteUserRequest,
) -> AppResult<InviteUserResult> {
    authz::engine::require(pool, actor_user_id, "users.invite").await?;

    let token = uuid::Uuid::new_v4().to_string();
    let invitation_id = format!("inv_{}", uuid_simple());
    let expires_at = (Utc::now() + chrono::Duration::days(14)).to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO invitations (invitation_id, project_id, invited_by_user_id, invited_email, token_hash, initial_role, expires_at, created_at)
        VALUES (?, '', ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&invitation_id)
    .bind(actor_user_id)
    .bind(&request.email)
    .bind(&token)
    .bind(&request.initial_role)
    .bind(&expires_at)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;

    Ok(InviteUserResult { invitation_id, token, expires_at })
}

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
    _device_id: &str,
    request: CreateUserRequest,
) -> AppResult<CreateUserResult> {
    authz::engine::require(pool, actor_user_id, "users.manage").await?;

    let existing: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&request.email)
        .fetch_optional(pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::Conflict(format!("email already exists: {}", request.email)));
    }

    let user_id = format!("usr_{}", uuid_simple());
    sqlx::query(
        "INSERT INTO users (id, email, display_name, state, created_at) VALUES (?, ?, ?, 'active', ?)",
    )
    .bind(&user_id)
    .bind(&request.email)
    .bind(&request.display_name)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;

    let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
        .bind(&request.initial_role)
        .fetch_one(pool)
        .await?;
    sqlx::query(
        "INSERT INTO user_roles (user_id, role_id, granted_at, granted_by) VALUES (?, ?, ?, ?)",
    )
    .bind(&user_id)
    .bind(&role_id)
    .bind(Utc::now().to_rfc3339())
    .bind(actor_user_id)
    .execute(pool)
    .await?;

    Ok(CreateUserResult { user_id })
}

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
    _device_id: &str,
    request: ChangeRoleRequest,
) -> AppResult<ChangeRoleResult> {
    authz::engine::require(pool, actor_user_id, "users.manage").await?;

    let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
        .bind(&request.new_role)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::Validation(format!("unknown role: {}", request.new_role)))?;

    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
        .bind(&request.user_id)
        .execute(pool)
        .await?;
    sqlx::query("INSERT INTO user_roles (user_id, role_id, granted_at, granted_by) VALUES (?, ?, ?, ?)")
        .bind(&request.user_id)
        .bind(&role_id)
        .bind(Utc::now().to_rfc3339())
        .bind(actor_user_id)
        .execute(pool)
        .await?;

    Ok(ChangeRoleResult { user_id: request.user_id, role: request.new_role })
}

#[derive(Debug, Deserialize)]
pub struct RemoveUserRequest {
    pub user_id: String,
    pub reason: String,
}

pub async fn remove_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    _device_id: &str,
    request: RemoveUserRequest,
) -> AppResult<()> {
    authz::engine::require(pool, actor_user_id, "users.manage").await?;

    sqlx::query("UPDATE users SET state = 'removed' WHERE id = ?")
        .bind(&request.user_id)
        .execute(pool)
        .await?;
    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
        .bind(&request.user_id)
        .execute(pool)
        .await?;

    let _ = request.reason;
    Ok(())
}
