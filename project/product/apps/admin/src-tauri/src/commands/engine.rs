use serde_json::Value;
use sqlx::SqlitePool;
use chrono::Utc;

use crate::error::AppResult;

pub struct CommandResult {
    pub resulting_sequence: i64,
    pub payload: Value,
}

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
    let (aggregate_type, aggregate_id, new_version, payload) = handler(&mut tx).await?;

    let event_id = format!("evt_{}", uuid_v7_like());
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
    .bind(correlation_id)
    .bind(serde_json::to_string(&payload)?)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO audit_entries (
            occurred_at, actor_user_id, actor_device_id, action,
            target_type, target_id, result, details, prev_hash, entry_hash
        ) VALUES (?, ?, ?, ?, ?, ?, 'success', ?, '0000000000000000000000000000000000000000000000000000000000000000', ?)
        "#,
    )
    .bind(Utc::now().to_rfc3339())
    .bind(actor_user_id)
    .bind(device_id)
    .bind(command_type)
    .bind(&aggregate_type)
    .bind(&aggregate_id)
    .bind(format!("{{\"sequence\":{sequence}}}"))
    .bind(format!("{:x}", md5::compute(format!("{}{}{}", actor_user_id, command_type, sequence).as_bytes())))
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
    if bits_in_buffer > 0 {
        let idx = ((buffer << (5 - bits_in_buffer)) & 0x1F) as usize;
        out.push(ALPHABET[idx] as char);
    }
    out
}
