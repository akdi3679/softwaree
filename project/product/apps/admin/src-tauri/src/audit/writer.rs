use chrono::Utc;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use crate::error::AppResult;

const GENESIS_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

pub async fn append(pool: &SqlitePool, actor_user_id: Option<&str>, actor_device_id: Option<&str>, action: &str, target_type: Option<&str>, target_id: Option<&str>, result: &str, details: Option<String>) -> AppResult<i64> {
    let mut tx = pool.begin().await?;
    let prev: Option<String> = sqlx::query_scalar("SELECT entry_hash FROM audit_entries ORDER BY id DESC LIMIT 1").fetch_optional(&mut *tx).await?;
    let prev_hash = prev.unwrap_or_else(|| GENESIS_HASH.to_string());
    let now = Utc::now().to_rfc3339();
    let mut hasher = Sha256::new();
    hasher.update(prev_hash.as_bytes());
    hasher.update(now.as_bytes());
    hasher.update(action.as_bytes());
    hasher.update(actor_user_id.unwrap_or("").as_bytes());
    hasher.update(actor_device_id.unwrap_or("").as_bytes());
    hasher.update(target_type.unwrap_or("").as_bytes());
    hasher.update(target_id.unwrap_or("").as_bytes());
    hasher.update(result.as_bytes());
    hasher.update(details.as_deref().unwrap_or("").as_bytes());
    let entry_hash = hex::encode(hasher.finalize());
    let id: i64 = sqlx::query_scalar("INSERT INTO audit_entries (occurred_at, actor_user_id, actor_device_id, action, target_type, target_id, result, details, prev_hash, entry_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")
        .bind(&now).bind(actor_user_id).bind(actor_device_id).bind(action).bind(target_type).bind(target_id).bind(result).bind(details).bind(&prev_hash).bind(&entry_hash)
        .fetch_one(&mut *tx).await?;
    tx.commit().await?;
    Ok(id)
}
#[derive(Debug, serde::Serialize)]
pub struct ChainVerification {
    pub valid: bool,
    pub total_entries: i64,
    pub checked: i64,
    pub broken_at_id: Option<i64>,
    pub reason: Option<String>,
}

/// Walk the audit chain from genesis and verify every entry's hash.
///
/// Returns `valid: true` if the entire chain is intact. On the first
/// broken entry, returns `valid: false` with the offending id and reason
/// ("prev_hash_mismatch" or "entry_hash_mismatch").
pub async fn verify_chain(pool: &SqlitePool) -> AppResult<ChainVerification> {
    let rows: Vec<(i64, String, Option<String>, Option<String>, String, Option<String>, Option<String>, String, Option<String>, String, String)> =
        sqlx::query_as(
            "SELECT id, occurred_at, actor_user_id, actor_device_id, action, target_type, target_id, result, details, prev_hash, entry_hash \
             FROM audit_entries ORDER BY id ASC",
        )
        .fetch_all(pool)
        .await?;

    let mut expected_prev = GENESIS_HASH.to_string();
    let mut checked: i64 = 0;

    for (id, _occurred_at, actor_user_id, actor_device_id, action, target_type, target_id, result, details, prev_hash, entry_hash) in rows.iter() {
        // 1. prev_hash must equal the previous entry_hash (or genesis)
        if prev_hash != &expected_prev {
            return Ok(ChainVerification {
                valid: false,
                total_entries: rows.len() as i64,
                checked,
                broken_at_id: Some(*id),
                reason: Some("prev_hash_mismatch".to_string()),
            });
        }

        // 2. entry_hash must recompute from this row's data
        let mut hasher = Sha256::new();
        hasher.update(prev_hash.as_bytes());
        hasher.update(action.as_bytes());
        hasher.update(actor_user_id.as_deref().unwrap_or("").as_bytes());
        hasher.update(actor_device_id.as_deref().unwrap_or("").as_bytes());
        hasher.update(target_type.as_deref().unwrap_or("").as_bytes());
        hasher.update(target_id.as_deref().unwrap_or("").as_bytes());
        hasher.update(result.as_bytes());
        hasher.update(details.as_deref().unwrap_or("").as_bytes());
        let recomputed = hex::encode(hasher.finalize());

        if &recomputed != entry_hash {
            return Ok(ChainVerification {
                valid: false,
                total_entries: rows.len() as i64,
                checked,
                broken_at_id: Some(*id),
                reason: Some("entry_hash_mismatch".to_string()),
            });
        }

        expected_prev = entry_hash.clone();
        checked += 1;
    }

    Ok(ChainVerification {
        valid: true,
        total_entries: rows.len() as i64,
        checked,
        broken_at_id: None,
        reason: None,
    })
}
