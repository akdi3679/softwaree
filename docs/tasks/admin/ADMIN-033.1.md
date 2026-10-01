# TASK ID: ADMIN-033.1
# TITLE: Add Admin: data quality checks (orphans, duplicates)
# STATUS: pending
# DEPENDENCIES: CONTRACT-085.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/data_quality.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Run periodic checks: orphaned records, duplicate events, broken refs.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/data_quality.rs`:

```rust
use sqlx::SqlitePool;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub struct QualityReport {
    pub total_events: i64,
    pub orphaned_projections: i64,
    pub duplicate_sequences: i64,
    pub missing_hashes: i64,
    pub last_event_at: Option<String>,
    pub issues: Vec<QualityIssue>,
}

#[derive(Serialize)]
pub struct QualityIssue {
    pub severity: String,
    pub code: String,
    pub message: String,
    pub count: i64,
}

pub async fn run_checks(pool: &SqlitePool) -> AppResult<QualityReport> {
    let total_events: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(pool).await?;
    let dups: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM (SELECT sequence, COUNT(*) c FROM events GROUP BY sequence HAVING c > 1)"
    ).fetch_one(pool).await?;
    let missing_hashes: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE hash IS NULL OR prev_hash IS NULL"
    ).fetch_one(pool).await?;
    let last: Option<String> = sqlx::query_scalar("SELECT MAX(occurred_at) FROM events").fetch_one(pool).await.ok();
    let mut issues = vec![];
    if dups > 0 { issues.push(QualityIssue { severity: "high".into(), code: "DUP_SEQ".into(), message: "Duplicate event sequences".into(), count: dups }); }
    if missing_hashes > 0 { issues.push(QualityIssue { severity: "high".into(), code: "MISSING_HASH".into(), message: "Events without hash".into(), count: missing_hashes }); }
    Ok(QualityReport {
        total_events,
        orphaned_projections: 0,
        duplicate_sequences: dups,
        missing_hashes,
        last_event_at: last,
        issues,
    })
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/data_quality.rs || { echo "FAIL"; exit 1; }
grep -q "run_checks" apps/admin/src-tauri/src/commands/data_quality.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
