# TASK ID: PERF-002.1
# TITLE: Add Admin SQLite tuning: WAL mode, mmap, page_size
# STATUS: pending
# DEPENDENCIES: ANALYTICS-002.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/db/project_db.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
PRAGMAs tuned for write-heavy audit + read-heavy projection.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/src-tauri/src/db/project_db.rs`. Add at the start of every connection open:

```rust
pub async fn apply_tuning(conn: &sqlx::sqlite::SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("PRAGMA journal_mode = WAL").execute(conn).await?;
    sqlx::query("PRAGMA synchronous = NORMAL").execute(conn).await?;
    sqlx::query("PRAGMA mmap_size = 268435456").execute(conn).await?; // 256 MB
    sqlx::query("PRAGMA page_size = 8192").execute(conn).await?;
    sqlx::query("PRAGMA temp_store = MEMORY").execute(conn).await?;
    sqlx::query("PRAGMA cache_size = -65536").execute(conn).await?; // 64 MB cache
    sqlx::query("PRAGMA foreign_keys = ON").execute(conn).await?;
    Ok(())
}
```

Call from `open()` after the pool is created.

## TESTS

```bash
cd product
grep -q "apply_tuning" apps/admin/src-tauri/src/db/project_db.rs || { echo "FAIL"; exit 1; }
grep -q "WAL" apps/admin/src-tauri/src/db/project_db.rs || { echo "FAIL: no WAL"; exit 1; }
echo "OK"
```
