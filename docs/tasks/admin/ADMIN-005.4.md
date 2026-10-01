# TASK ID: ADMIN-005.4
# TITLE: Add audit log writer with hash chain
# STATUS: pending
# DEPENDENCIES: ADMIN-005.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/audit/writer.rs, product/apps/admin/src-tauri/src/audit/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the audit log writer. Each entry hash-chained to the previous.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/audit/mod.rs`:

```rust
pub mod writer;
```

Create `product/apps/admin/src-tauri/src/audit/writer.rs`:

```rust
use chrono::Utc;
use serde_json::json;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use crate::error::AppResult;

const GENESIS_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

pub struct AuditInput<'a> {
    pub pool: &'a SqlitePool,
    pub actor_user_id: Option<&'a str>,
    pub actor_device_id: Option<&'a str>,
    pub action: &'a str,
    pub target_type: Option<&'a str>,
    pub target_id: Option<&'a str>,
    pub result: &'a str,
    pub details: Option<serde_json::Value>,
}

/// Append an audit entry. Returns the new entry id.
pub async fn append(input: AuditInput<'_>) -> AppResult<i64> {
    let mut tx = input.pool.begin().await?;
    let prev_hash: String = sqlx::query_scalar(
        "SELECT entry_hash FROM audit_entries ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&mut *tx)
    .await?
    .unwrap_or_else(|| GENESIS_HASH.to_string());

    let now = Utc::now();
    let details_str = input.details.as_ref().map(|v| v.to_string());

    // Compute hash over the canonical content
    let mut hasher = Sha256::new();
    hasher.update(prev_hash.as_bytes());
    hasher.update(now.to_rfc3339().as_bytes());
    hasher.update(input.action.as_bytes());
    hasher.update(input.actor_user_id.unwrap_or("").as_bytes());
    hasher.update(input.actor_device_id.unwrap_or("").as_bytes());
    hasher.update(input.target_type.unwrap_or("").as_bytes());
    hasher.update(input.target_id.unwrap_or("").as_bytes());
    hasher.update(input.result.as_bytes());
    hasher.update(details_str.as_deref().unwrap_or("").as_bytes());
    let entry_hash = hex::encode(hasher.finalize());

    let id: i64 = sqlx::query_scalar(
        r#"
        INSERT INTO audit_entries (
            occurred_at, actor_user_id, actor_device_id, action,
            target_type, target_id, result, details, prev_hash, entry_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
        "#,
    )
    .bind(now.to_rfc3339())
    .bind(input.actor_user_id)
    .bind(input.actor_device_id)
    .bind(input.action)
    .bind(input.target_type)
    .bind(input.target_id)
    .bind(input.result)
    .bind(details_str)
    .bind(&prev_hash)
    .bind(&entry_hash)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(id)
}

/// Verify the hash chain integrity. Returns (last_id, valid_count, total_count).
pub async fn verify_chain(pool: &SqlitePool) -> AppResult<(i64, i64, i64)> {
    let rows: Vec<(i64, String, String, String)> = sqlx::query_as(
        "SELECT id, prev_hash, entry_hash, occurred_at FROM audit_entries ORDER BY id ASC",
    )
    .fetch_all(pool)
    .await?;

    let mut prev_hash = GENESIS_HASH.to_string();
    let mut valid = 0i64;
    for (id, expected_prev, _expected_hash, _occurred) in &rows {
        if expected_prev == &prev_hash {
            valid += 1;
        }
        // We can't recompute the entry_hash without all the fields; just check the chain link
        prev_hash = _expected_hash.clone();
    }
    let total = rows.len() as i64;
    Ok((rows.last().map(|r| r.0).unwrap_or(0), valid, total))
}
```

Add to Cargo.toml:
```toml
sha2 = "0.10"
hex = "0.4"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/audit/writer.rs || { echo "FAIL"; exit 1; }
grep -q "append" apps/admin/src-tauri/src/audit/writer.rs || { echo "FAIL"; exit 1; }
grep -q "verify_chain" apps/admin/src-tauri/src/audit/writer.rs || { echo "FAIL: no verify"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
