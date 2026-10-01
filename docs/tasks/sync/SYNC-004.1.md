# TASK ID: SYNC-004.1
# TITLE: Add sync: event gap recovery via full snapshot
# STATUS: pending
# DEPENDENCIES: USER-010.3
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/snapshot_apply.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When User detects a gap > 7 days OR > 5000 events missing, request a full snapshot.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/snapshot_apply.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;
use product_contracts::sync::SnapshotPayload;

pub async fn apply_snapshot(pool: &SqlitePool, snap: &SnapshotPayload) -> AppResult<()> {
    let mut tx = pool.begin().await?;
    // 1. Clear all projection tables
    for table in &["projection_patients", "projection_appointments", "projection_visits", "projection_samples", "projection_audit"] {
        sqlx::query(&format!("DELETE FROM {}", table)).execute(&mut *tx).await?;
    }
    // 2. Apply every event in order
    for ev_json in &snap.events {
        let v: serde_json::Value = serde_json::from_slice(ev_json)?;
        let aggregate_type = v.get("aggregate_type").and_then(|x| x.as_str()).unwrap_or("");
        let aggregate_id = v.get("aggregate_id").and_then(|x| x.as_str()).unwrap_or("");
        let payload = v.get("payload").cloned().unwrap_or(serde_json::Value::Null);
        let table = format!("projection_{}", aggregate_type);
        let payload_str = serde_json::to_string(&payload)?;
        let sql = format!(
            "INSERT OR REPLACE INTO {} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            table
        );
        sqlx::query(&sql)
            .bind(aggregate_id)
            .bind(&payload_str)
            .execute(&mut *tx)
            .await?;
    }
    // 3. Update local cursor
    sqlx::query("UPDATE sync_state SET last_sequence = ?, last_snapshot_at = ? WHERE id = 1")
        .bind(snap.through_sequence)
        .bind(chrono::Utc::now().to_rfc3339())
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(())
}

/// Should we request a snapshot?
pub fn needs_snapshot(missing: i64, oldest_unapplied_age_secs: i64) -> bool {
    const SEQUENCE_THRESHOLD: i64 = 5000;
    const AGE_THRESHOLD_SECS: i64 = 7 * 24 * 60 * 60; // 7 days
    missing > SEQUENCE_THRESHOLD || oldest_unapplied_age_secs > AGE_THRESHOLD_SECS
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/snapshot_apply.rs || { echo "FAIL"; exit 1; }
grep -q "apply_snapshot" apps/user/src-tauri/src/sync/snapshot_apply.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
