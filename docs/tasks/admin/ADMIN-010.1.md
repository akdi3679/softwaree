# TASK ID: ADMIN-010.1
# TITLE: Add backup snapshot builder
# STATUS: pending
# DEPENDENCIES: ADMIN-009.7
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/snapshot.rs, product/apps/admin/src-tauri/src/backup/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Build a backup snapshot of a project's SQLite database.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/mod.rs`:

```rust
pub mod snapshot;
pub mod crypto;
pub mod upload;
```

Create `product/apps/admin/src-tauri/src/backup/snapshot.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use chrono::Utc;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use std::io::Write;
use std::path::Path;

use crate::error::{AppError, AppResult};

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

/// Build a backup snapshot from the current state of the project DB.
pub async fn build(
    pool: &SqlitePool,
    project_id: &str,
    project_name: &str,
    note: Option<String>,
) -> AppResult<BackupSnapshot> {
    // Get the current database file path
    let path: String = sqlx::query_scalar(
        "SELECT file_path FROM projects WHERE id = ?",
    )
    .bind(project_id)
    .fetch_one(pool)
    .await?;

    // Read the database file
    let db_bytes = tokio::fs::read(&path).await?;
    let mut hasher = Sha256::new();
    hasher.update(&db_bytes);
    let db_sha256 = hex::encode(hasher.finalize());

    Ok(BackupSnapshot {
        version: BACKUP_VERSION,
        project_id: project_id.to_string(),
        project_name: project_name.to_string(),
        created_at: Utc::now().to_rfc3339(),
        schema_version: 2, // matches current migration count
        database_sha256: db_sha256,
        encrypted_size_bytes: 0, // filled in after encryption
        compressed_size_bytes: db_bytes.len() as u64,
        note,
    })
}

/// Get the raw database file path.
pub fn db_path_for(snapshot: &BackupSnapshot) -> String {
    // This would be re-derived from project_id in real impl
    format!("{}.sqlite", snapshot.project_id)
}
```

Add to Cargo.toml:
```toml
flate2 = "1"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/snapshot.rs || { echo "FAIL"; exit 1; }
grep -q "fn build" apps/admin/src-tauri/src/backup/snapshot.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -3 || { echo "FAIL"; exit 1; }
echo "OK"
```
