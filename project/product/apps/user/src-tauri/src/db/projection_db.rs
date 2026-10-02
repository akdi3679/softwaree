use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::path::Path;
use std::str::FromStr;

use crate::error::{AppError, AppResult};

pub struct ProjectionDb {
    pub pool: SqlitePool,
    pub project_id: String,
}

impl ProjectionDb {
    pub async fn open(db_path: &Path, project_id: &str) -> AppResult<Self> {
        let url = format!("sqlite://{}?mode=rwc", db_path.display());
        let opts = SqliteConnectOptions::from_str(&url)?
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(opts).await?;
        sqlx::migrate!("./migrations").run(&pool).await.map_err(|e| AppError::Internal(e.to_string()))?;
        Ok(Self {
            pool,
            project_id: project_id.to_string(),
        })
    }

    pub async fn get_position(&self) -> AppResult<i64> {
        let row: Option<(i64,)> = sqlx::query_as(
            "SELECT last_applied_sequence FROM projection_state WHERE project_id = ?",
        )
        .bind(&self.project_id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(|(s,)| s).unwrap_or(0))
    }
}
