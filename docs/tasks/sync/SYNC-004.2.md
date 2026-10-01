# TASK ID: SYNC-004.2
# TITLE: Add sync: per-table cursor (per aggregate_type)
# STATUS: pending
# DEPENDENCIES: SYNC-004.1
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/per_table_cursor.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Optimize: don't replay all events for patients if only a new visit came in.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/per_table_cursor.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;

pub async fn get_cursor(pool: &SqlitePool, table: &str) -> AppResult<i64> {
    let v: Option<i64> = sqlx::query_scalar("SELECT last_sequence FROM per_table_cursor WHERE table_name = ?")
        .bind(table).fetch_optional(pool).await?;
    Ok(v.unwrap_or(0))
}

pub async fn set_cursor(pool: &SqlitePool, table: &str, sequence: i64) -> AppResult<()> {
    sqlx::query("INSERT INTO per_table_cursor (table_name, last_sequence) VALUES (?, ?) ON CONFLICT(table_name) DO UPDATE SET last_sequence = MAX(last_sequence, excluded.last_sequence)")
        .bind(table)
        .bind(sequence)
        .execute(pool)
        .await?;
    Ok(())
}
```

Add migration `005_per_table_cursor.sql`:
```sql
CREATE TABLE IF NOT EXISTS per_table_cursor (
  table_name TEXT PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/per_table_cursor.rs || { echo "FAIL"; exit 1; }
grep -q "per_table_cursor" apps/user/src-tauri/src/sync/per_table_cursor.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
