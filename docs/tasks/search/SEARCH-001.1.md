# TASK ID: SEARCH-001.1
# TITLE: Add SQLite FTS5 full-text search on User side
# STATUS: pending
# DEPENDENCIES: NOTIF-001.2
# ALLOWED FILES: product/apps/user/src-tauri/migrations/002_search.sql, product/apps/user/src-tauri/src/search/mod.rs, product/apps/user/src-tauri/src/search/fts.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Full-text search on the User's local projection. FTS5 for SQLite.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/migrations/002_search.sql`:

```sql
-- FTS5 virtual table for searchable text
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    aggregate_type,
    aggregate_id,
    title,
    body,
    tokenize = 'porter unicode61'
);
```

Create `product/apps/user/src-tauri/src/search/mod.rs`:

```rust
pub mod fts;
```

Create `product/apps/user/src-tauri/src/search/fts.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;

#[derive(Debug, Clone, serde::Serialize)]
pub struct SearchResult {
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub title: String,
    pub body: String,
    pub rank: f64,
}

/// Add or update a row in the search index.
pub async fn index(pool: &SqlitePool, aggregate_type: &str, aggregate_id: &str, title: &str, body: &str) -> AppResult<()> {
    // FTS5 upsert
    sqlx::query("DELETE FROM search_index WHERE aggregate_type = ? AND aggregate_id = ?")
        .bind(aggregate_type)
        .bind(aggregate_id)
        .execute(pool).await?;
    sqlx::query("INSERT INTO search_index (aggregate_type, aggregate_id, title, body) VALUES (?, ?, ?, ?)")
        .bind(aggregate_type)
        .bind(aggregate_id)
        .bind(title)
        .bind(body)
        .execute(pool).await?;
    Ok(())
}

/// Search the index. Returns up to `limit` results, ranked by relevance.
pub async fn search(pool: &SqlitePool, query: &str, limit: i64) -> AppResult<Vec<SearchResult>> {
    let escaped = escape_fts_query(query);
    let rows: Vec<(String, String, String, String, f64)> = sqlx::query_as(
        "SELECT aggregate_type, aggregate_id, title, body, rank FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT ?"
    )
    .bind(&escaped)
    .bind(limit)
    .fetch_all(pool).await?;
    Ok(rows.into_iter().map(|(a, i, t, b, r)| SearchResult {
        aggregate_type: a, aggregate_id: i, title: t, body: b, rank: r,
    }).collect())
}

fn escape_fts_query(q: &str) -> String {
    // Wrap in double quotes to handle special chars; allow * suffix for prefix
    format!("\"{}\"", q.replace('"', "\"\""))
}
```

Wire into the projection applier so every `patient.created`, `sample.intaken`, etc. is also indexed.

Add Tauri command in `product/apps/user/src-tauri/src/commands/search.rs`:

```rust
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;
use crate::search::fts;

#[tauri::command]
pub async fn search(state: State<'_, AppState>, query: String, limit: Option<i64>) -> AppResult<Vec<fts::SearchResult>> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| crate::error::AppError::NotFound("no active projection".into()))?;
    fts::search(&proj.pool, &query, limit.unwrap_or(50)).await
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/migrations/002_search.sql || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/search/fts.rs || { echo "FAIL: no fts"; exit 1; }
grep -q "fts5" apps/user/src-tauri/migrations/002_search.sql || { echo "FAIL: no fts5"; exit 1; }
echo "OK"
```
