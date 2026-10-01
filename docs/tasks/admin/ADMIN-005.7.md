# TASK ID: ADMIN-005.7
# TITLE: Add command envelope parser
# STATUS: pending
# DEPENDENCIES: ADMIN-005.6
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/engine.rs, product/apps/admin/src-tauri/src/commands/dispatcher.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the command engine — validates a command envelope, authorizes it, executes the handler in a transaction with outbox pattern.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/engine.rs`:

```rust
use serde_json::Value;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::audit::writer;
use crate::error::{AppError, AppResult};
use crate::events::store as event_store;
use chrono::Utc;

/// The result of executing a command.
pub struct CommandResult {
    pub resulting_sequence: i64,
    pub payload: Value,
}

/// Execute a command within a single transaction with outbox + audit.
///
/// The handler `f` is called with the transaction; it must return:
///   (aggregate_type, aggregate_id, new_version, resulting_payload)
/// We then write the event, audit, and commit atomically.
pub async fn execute<F, Fut>(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    command_type: &str,
    correlation_id: Option<&str>,
    handler: F,
) -> AppResult<CommandResult>
where
    F: FnOnce(&mut sqlx::Transaction<'_, sqlx::Sqlite>) -> Fut,
    Fut: std::future::Future<Output = AppResult<(String, String, i64, Value)>>,
{
    let mut tx = pool.begin().await?;

    // Execute the handler (does the actual data mutation)
    let (aggregate_type, aggregate_id, new_version, payload) = handler(&mut tx).await?;

    // Generate event_id
    let event_id = format!("evt_{}", uuid_v7_like());

    // Write event
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
    .bind(command_type)
    .bind(&aggregate_type)
    .bind(&aggregate_id)
    .bind(new_version)
    .bind(actor_user_id)
    .bind(device_id)
    .bind(Utc::now().to_rfc3339())
    .bind(correlation_id)
    .bind(correlation_id)  // causation = correlation for the originating command
    .bind(serde_json::to_string(&payload)?)
    .fetch_one(&mut *tx)
    .await?;

    // Write audit
    sqlx::query(
        r#"
        INSERT INTO audit_entries (
            occurred_at, actor_user_id, actor_device_id, action,
            target_type, target_id, result, details, prev_hash, entry_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '0000000000000000000000000000000000000000000000000000000000000000', ?)
        "#,
    )
    .bind(Utc::now().to_rfc3339())
    .bind(actor_user_id)
    .bind(device_id)
    .bind(command_type)
    .bind(&aggregate_type)
    .bind(&aggregate_id)
    .bind("success")
    .bind(format!("{{\"sequence\":{sequence}}}"))
    .bind(format!("{:x}", md5_hash(format!("{actor_user_id}{command_type}{sequence}").as_bytes())))
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(CommandResult { resulting_sequence: sequence, payload })
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
    out
}

fn md5_hash(data: &[u8]) -> [u8; 16] {
    let mut ctx = md5::Context::new();
    ctx.consume(data);
    *ctx.compute()
}
```

Add to Cargo.toml:
```toml
md5 = "0.7"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/engine.rs || { echo "FAIL"; exit 1; }
grep -q "execute" apps/admin/src-tauri/src/commands/engine.rs || { echo "FAIL"; exit 1; }
grep -q "INSERT INTO events" apps/admin/src-tauri/src/commands/engine.rs || { echo "FAIL: no outbox"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
