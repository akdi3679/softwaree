use sqlx::SqlitePool;
use crate::error::{AppError, AppResult};

pub async fn can(pool: &SqlitePool, user_id: &str, permission: &str) -> AppResult<bool> {
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

pub async fn require(pool: &SqlitePool, user_id: &str, permission: &str) -> AppResult<()> {
    if can(pool, user_id, permission).await? {
        Ok(())
    } else {
        Err(AppError::PermissionDenied(format!(
            "user {user_id} missing permission {permission}"
        )))
    }
}

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
