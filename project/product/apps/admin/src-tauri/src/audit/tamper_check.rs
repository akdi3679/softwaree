use sqlx::SqlitePool;

use crate::error::AppResult;

/// Walk the audit chain in order and verify each entry's prev_hash
/// matches the previous entry's entry_hash. Returns the first id where
/// the chain is broken (or None if intact).
///
/// NOTE: uses runtime-checked sqlx::query_as, so it does not require the
/// audit_entries table at compile time. It will fail at runtime if the
/// table is missing.
pub async fn detect_tampering(pool: &SqlitePool) -> AppResult<Option<i64>> {
    let rows: Vec<(i64, Option<String>, String)> = sqlx::query_as(
        "SELECT id, prev_hash, entry_hash FROM audit_entries ORDER BY id ASC"
    ).fetch_all(pool).await?;

    let mut expected_prev: Option<String> = None;
    for (id, prev, current) in rows {
        if let Some(exp) = &expected_prev {
            match &prev {
                Some(p) if p == exp => {},
                _ => return Ok(Some(id)),
            }
        }
        expected_prev = Some(current);
    }
    Ok(None)
}
