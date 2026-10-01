# TASK ID: ADMIN-039.1
# TITLE: Add Admin: full-text search across all events
# STATUS: pending
# DEPENDENCIES: ADMIN-038.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/event_search.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can search their own events with substring matching.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
rusqlite = { version = "0.31", features = ["bundled"] }
```

Create `product/apps/admin/src-tauri/src/commands/event_search.rs`:

```rust
use sqlx::SqlitePool;
use serde::Serialize;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Serialize)]
pub struct SearchHit {
    pub sequence: i64,
    pub event_type: String,
    pub aggregate_id: String,
    pub occurred_at: String,
    pub snippet: String,
}

#[tauri::command]
pub async fn search_events(
    state: State<'_, AppState>,
    project_id: String,
    query: String,
    limit: u32,
) -> AppResult<Vec<SearchHit>> {
    let handle = state.projects.read().await.get(&project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
    let q = format!("%{}%", query.replace('%', r"\%").replace('_', r"\_"));
    let rows: Vec<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, aggregate_id, occurred_at, substr(payload, 1, 200) FROM events WHERE payload LIKE ? OR aggregate_id LIKE ? ORDER BY sequence DESC LIMIT ?"
    )
        .bind(&q)
        .bind(&q)
        .bind(limit as i64)
        .fetch_all(&handle.db)
        .await?;
    Ok(rows.into_iter().map(|(s, e, a, o, sn)| SearchHit {
        sequence: s, event_type: e, aggregate_id: a, occurred_at: o, snippet: sn,
    }).collect())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/event_search.rs || { echo "FAIL"; exit 1; }
grep -q "search_events" apps/admin/src-tauri/src/commands/event_search.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
