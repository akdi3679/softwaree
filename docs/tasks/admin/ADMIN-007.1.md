# TASK ID: ADMIN-007.1
# TITLE: Add per-user projection tracking
# STATUS: pending
# DEPENDENCIES: ADMIN-006.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/projection.rs, product/apps/admin/src-tauri/src/sync/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Track per-user projection cursor (last applied event sequence).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/mod.rs`:

```rust
pub mod projection;
pub mod events;
```

Create `product/apps/admin/src-tauri/src/sync/projection.rs`:

```rust
use chrono::Utc;
use sqlx::SqlitePool;
use crate::error::AppResult;

#[derive(Debug, Clone)]
pub struct ProjectionPosition {
    pub user_id: String,
    pub device_id: String,
    pub last_applied_sequence: i64,
    pub snapshot_at_sequence: Option<i64>,
    pub snapshot_at: Option<String>,
    pub projection_format_version: i64,
}

pub async fn get_position(
    pool: &SqlitePool,
    user_id: &str,
    device_id: &str,
) -> AppResult<ProjectionPosition> {
    let row: Option<(i64, Option<i64>, Option<String>, i64)> = sqlx::query_as(
        r#"
        SELECT last_applied_sequence, snapshot_at_sequence, snapshot_at, projection_format_version
        FROM user_projections
        WHERE user_id = ? AND device_id = ?
        "#,
    )
    .bind(user_id)
    .bind(device_id)
    .fetch_optional(pool)
    .await?;

    Ok(match row {
        Some((last, snap_seq, snap_at, fmt)) => ProjectionPosition {
            user_id: user_id.to_string(),
            device_id: device_id.to_string(),
            last_applied_sequence: last,
            snapshot_at_sequence: snap_seq,
            snapshot_at: snap_at,
            projection_format_version: fmt,
        },
        None => ProjectionPosition {
            user_id: user_id.to_string(),
            device_id: device_id.to_string(),
            last_applied_sequence: 0,
            snapshot_at_sequence: None,
            snapshot_at: None,
            projection_format_version: 1,
        },
    })
}

pub async fn advance_to(
    pool: &SqlitePool,
    user_id: &str,
    device_id: &str,
    new_sequence: i64,
) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO user_projections (user_id, device_id, last_applied_sequence, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, device_id) DO UPDATE
        SET last_applied_sequence = MAX(last_applied_sequence, excluded.last_applied_sequence),
            updated_at = excluded.updated_at
        "#,
    )
    .bind(user_id)
    .bind(device_id)
    .bind(new_sequence)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn record_snapshot(
    pool: &SqlitePool,
    user_id: &str,
    device_id: &str,
    at_sequence: i64,
) -> AppResult<()> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO user_projections (user_id, device_id, last_applied_sequence, snapshot_at_sequence, snapshot_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, device_id) DO UPDATE
        SET last_applied_sequence = MAX(last_applied_sequence, excluded.last_applied_sequence),
            snapshot_at_sequence = excluded.snapshot_at_sequence,
            snapshot_at = excluded.snapshot_at,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(user_id)
    .bind(device_id)
    .bind(at_sequence)
    .bind(at_sequence)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/projection.rs || { echo "FAIL"; exit 1; }
grep -q "advance_to" apps/admin/src-tauri/src/sync/projection.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
