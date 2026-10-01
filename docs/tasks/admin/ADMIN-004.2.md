# TASK ID: ADMIN-004.2
# TITLE: Add SQLite connection pool
# STATUS: pending
# DEPENDENCIES: ADMIN-004.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/db/pool.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the SQLite connection pool helper.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/db/pool.rs`:

```rust
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::path::Path;
use std::str::FromStr;
use crate::error::AppResult;

/// Create a SQLite connection pool for a project database.
///
/// Uses WAL mode for concurrent reads + serialized writes.
/// Applies an encryption key if the database is encrypted (SQLCipher).
pub async fn create_pool(db_path: &Path, encryption_key: Option<&str>) -> AppResult<SqlitePool> {
    let url = if let Some(key) = encryption_key {
        format!("sqlite:{}?mode=rw&key={}", db_path.display(), key)
    } else {
        format!("sqlite:{}?mode=rw", db_path.display())
    };

    let opts = SqliteConnectOptions::from_str(&url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(std::time::Duration::from_secs(5))
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)  -- small: Admin is a desktop app, one user
        .min_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect_with(opts)
        .await?;

    Ok(pool)
}
```

Note: For SQLCipher encryption, we'd need the `sqlcipher` feature on sqlx and a build dependency. For v1 we use plain SQLite; encryption is added in v1.1.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/db/pool.rs || { echo "FAIL"; exit 1; }
grep -q "SqlitePool" apps/admin/src-tauri/src/db/pool.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
