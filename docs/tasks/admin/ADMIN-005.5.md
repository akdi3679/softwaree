# TASK ID: ADMIN-005.5
# TITLE: Add event store with monotonic sequence
# STATUS: pending
# DEPENDENCIES: ADMIN-005.4
# ALLOWED FILES: product/apps/admin/src-tauri/src/events/store.rs, product/apps/admin/src-tauri/src/events/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the event store — append-only event log with monotonic sequence.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/events/mod.rs`:

```rust
pub mod store;
```

Create `product/apps/admin/src-tauri/src/events/store.rs`:

```rust
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredEvent {
    pub sequence: i64,
    pub event_id: String,
    pub event_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub aggregate_version: i64,
    pub actor_user_id: String,
    pub device_id: String,
    pub occurred_at: String,
    pub correlation_id: Option<String>,
    pub causation_id: Option<String>,
    pub payload: Value,
}

pub struct AppendEvent<'a> {
    pub pool: &'a SqlitePool,
    pub event_type: &'a str,
    pub aggregate_type: &'a str,
    pub aggregate_id: &'a str,
    pub aggregate_version: i64,
    pub actor_user_id: &'a str,
    pub device_id: &'a str,
    pub correlation_id: Option<&'a str>,
    pub causation_id: Option<&'a str>,
    pub payload: Value,
}

/// Append a new event. Returns the new sequence number.
pub async fn append(input: AppendEvent<'_>) -> AppResult<i64> {
    let event_id = format!("evt_{}", uuid_v7_like());
    let now = Utc::now().to_rfc3339();

    let mut tx = input.pool.begin().await?;
    let sequence: i64 = sqlx::query_scalar(
        r#"
        INSERT INTO events (
            event_id, event_type, aggregate_type, aggregate_id,
            aggregate_version, actor_user_id, device_id, occurred_at,
            correlation_id, causation_id, payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING sequence
        "#,
    )
    .bind(&event_id)
    .bind(input.event_type)
    .bind(input.aggregate_type)
    .bind(input.aggregate_id)
    .bind(input.aggregate_version)
    .bind(input.actor_user_id)
    .bind(input.device_id)
    .bind(&now)
    .bind(input.correlation_id)
    .bind(input.causation_id)
    .bind(serde_json::to_string(&input.payload)?)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(sequence)
}

/// Read events since a given sequence.
pub async fn read_since(pool: &SqlitePool, since_sequence: i64, limit: i64) -> AppResult<Vec<StoredEvent>> {
    let rows: Vec<(i64, String, String, String, String, i64, String, String, String, Option<String>, Option<String>, String)> = sqlx::query_as(
        r#"
        SELECT sequence, event_id, event_type, aggregate_type, aggregate_id,
               aggregate_version, actor_user_id, device_id, occurred_at,
               correlation_id, causation_id, payload
        FROM events
        WHERE sequence > ?
        ORDER BY sequence ASC
        LIMIT ?
        "#,
    )
    .bind(since_sequence)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|(sequence, event_id, event_type, aggregate_type, aggregate_id, aggregate_version, actor_user_id, device_id, occurred_at, correlation_id, causation_id, payload)| StoredEvent {
            sequence,
            event_id,
            event_type,
            aggregate_type,
            aggregate_id,
            aggregate_version,
            actor_user_id,
            device_id,
            occurred_at,
            correlation_id,
            causation_id,
            payload: serde_json::from_str(&payload).unwrap_or(Value::Null),
        })
        .collect())
}

/// Get the latest sequence number.
pub async fn latest_sequence(pool: &SqlitePool) -> AppResult<i64> {
    let seq: Option<i64> = sqlx::query_scalar("SELECT MAX(sequence) FROM events")
        .fetch_optional(pool)
        .await?;
    Ok(seq.unwrap_or(0))
}

fn uuid_v7_like() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: [u8; 14] = std::array::from_fn(|_| rng.gen());
    const ALPHABET: &[u8; 32] = b"0123456789abcdefghjkmnpqrstvwxyz";
    let mut out = String::with_capacity((bytes.len() * 8 + 4) / 5);
    let mut buffer: u64 = 0;
    let mut bits_in_buffer = 0;
    for &b in &bytes {
        buffer = (buffer << 8) | (b as u64);
        bits_in_buffer += 8;
        while bits_in_buffer >= 5 {
            bits_in_buffer -= 5;
            let idx = ((buffer >> bits_in_buffer) & 0x1F) as usize;
            out.push(ALPHABET[idx] as char);
        }
    }
    if bits_in_buffer > 0 {
        let idx = ((buffer << (5 - bits_in_buffer)) & 0x1F) as usize;
        out.push(ALPHABET[idx] as char);
    }
    out
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/events/store.rs || { echo "FAIL"; exit 1; }
grep -q "append" apps/admin/src-tauri/src/events/store.rs || { echo "FAIL"; exit 1; }
grep -q "read_since" apps/admin/src-tauri/src/events/store.rs || { echo "FAIL: no read"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
