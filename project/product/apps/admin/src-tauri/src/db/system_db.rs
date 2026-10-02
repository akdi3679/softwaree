use sqlx::SqlitePool;

use crate::db::pool;
use crate::error::AppResult;
use crate::state::AppState;

/// Open (or create) the system SQLite database and run system migrations.
///
/// The system DB holds data that is not project-scoped: notifications,
/// push subscriptions, cached cloud metadata, local account preferences.
/// It is separate from each project's SQLite file.
pub async fn init(state: &AppState) -> AppResult<()> {
    let path = state.paths.data_dir.join("system.db");
    let pool = pool::create_pool(&path).await?;
    run_system_migrations(&pool).await?;
    let mut guard = state.system_db.write().await;
    *guard = Some(pool);
    Ok(())
}

async fn run_system_migrations(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS system_schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    if !is_applied(pool, 4).await? {
        sqlx::query(include_str!("../../migrations/004_notifications.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 4).await?;
    }

    if !is_applied(pool, 5).await? {
        sqlx::query(include_str!("../../migrations/005_push_subscriptions.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 5).await?;
    }

    Ok(())
}

async fn is_applied(pool: &SqlitePool, version: i64) -> AppResult<bool> {
    let row: Option<(i64,)> =
        sqlx::query_as("SELECT version FROM system_schema_version WHERE version = ?")
            .bind(version)
            .fetch_optional(pool)
            .await?;
    Ok(row.is_some())
}

async fn mark_applied(pool: &SqlitePool, version: i64) -> AppResult<()> {
    sqlx::query("INSERT INTO system_schema_version (version, applied_at) VALUES (?, ?)")
        .bind(version)
        .bind(chrono::Utc::now().to_rfc3339())
        .execute(pool)
        .await?;
    Ok(())
}