use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

use crate::error::AppResult;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupSnapshot {
    pub version: i32,
    pub project_id: String,
    pub project_name: String,
    pub created_at: String,
    pub schema_version: i32,
    pub database_sha256: String,
    pub encrypted_size_bytes: u64,
    pub compressed_size_bytes: u64,
    pub note: Option<String>,
}

pub const BACKUP_VERSION: i32 = 1;

pub async fn build(
    pool: &SqlitePool,
    project_id: &str,
    project_name: &str,
    note: Option<String>,
) -> AppResult<BackupSnapshot> {
    let path: String = sqlx::query_scalar(
        "SELECT file_path FROM projects WHERE id = ?",
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    let db_bytes = tokio::fs::read(&path).await?;
    let mut hasher = Sha256::new();
    hasher.update(&db_bytes);
    let db_sha256 = hex::encode(hasher.finalize());

    Ok(BackupSnapshot {
        version: BACKUP_VERSION,
        project_id: project_id.to_string(),
        project_name: project_name.to_string(),
        created_at: Utc::now().to_rfc3339(),
        schema_version: 2,
        database_sha256: db_sha256,
        encrypted_size_bytes: 0,
        compressed_size_bytes: db_bytes.len() as u64,
        note,
    })
}
