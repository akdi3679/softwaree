use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::path::Path;
use std::str::FromStr;
use crate::error::AppResult;

pub async fn create_pool(db_path: &Path) -> AppResult<SqlitePool> {
    let url = format!("sqlite:{}?mode=rw", db_path.display());
    let opts = SqliteConnectOptions::from_str(&url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(std::time::Duration::from_secs(5))
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect_with(opts)
        .await?;

    Ok(pool)
}
