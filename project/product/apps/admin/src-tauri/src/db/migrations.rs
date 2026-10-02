use sqlx::SqlitePool;
use crate::db::seed_roles;
use crate::error::AppResult;

pub async fn run(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    if !is_applied(pool, 1).await? {
        sqlx::query(include_str!("../../migrations/001_core.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 1).await?;
    }

    if !is_applied(pool, 2).await? {
        sqlx::query(include_str!("../../migrations/002_outbox.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 2).await?;
    }

    if !is_applied(pool, 3).await? {
        sqlx::query(include_str!("../../migrations/003_invitations.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 3).await?;
    }

    if !is_applied(pool, 7).await? {
        sqlx::query(include_str!("../../migrations/007_idempotency_keys.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 7).await?;
    }

    if !is_applied(pool, 7).await? {
        sqlx::query(include_str!("../../migrations/007_idempotency_keys.sql")).execute(pool).await?;
        mark_applied(pool, 7).await?;
    }
    seed_roles::seed_roles(pool).await?;

    Ok(())
}

async fn is_applied(pool: &SqlitePool, version: i64) -> AppResult<bool> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT version FROM schema_version WHERE version = ?")
        .bind(version)
        .fetch_optional(pool)
        .await?;
    Ok(row.is_some())
}

async fn mark_applied(pool: &SqlitePool, version: i64) -> AppResult<()> {
    sqlx::query("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)")
        .bind(version)
        .bind(chrono::Utc::now().to_rfc3339())
        .execute(pool)
        .await?;
    Ok(())
}

