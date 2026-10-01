# TASK ID: AUDIT-003.1
# TITLE: Add audit — tamper detection demo
# STATUS: pending
# DEPENDENCIES: SECURITY-004.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/audit/tamper_check.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
For demos and training: show how tampering is detected.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/audit/tamper_check.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;

/// Walk the entire event chain, verify each `prev_hash` matches
/// the previous event's `hash`. Returns the first sequence where
/// tampering was detected (or None if the chain is intact).
pub async fn detect_tampering(pool: &SqlitePool) -> AppResult<Option<i64>> {
    let mut last_hash: Option<String> = None;
    let mut rows = sqlx::query!("SELECT sequence, prev_hash, hash FROM events ORDER BY sequence ASC")
        .fetch_all(pool)
        .await?;
    for row in &rows {
        if let Some(expected_prev) = &last_hash {
            if let Some(actual) = &row.prev_hash {
                if expected_prev != actual {
                    return Ok(Some(row.sequence));
                }
            } else {
                return Ok(Some(row.sequence));
            }
        }
        last_hash = Some(row.hash.clone().unwrap_or_default());
    }
    Ok(None)
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/audit/tamper_check.rs || { echo "FAIL"; exit 1; }
grep -q "detect_tampering" apps/admin/src-tauri/src/audit/tamper_check.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
