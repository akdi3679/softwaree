use sqlx::SqlitePool;

use crate::error::AppResult;

pub async fn get_cursor(pool: &SqlitePool, table: &str) -> AppResult<i64> {
    let v: Option<i64> =
        sqlx::query_scalar("SELECT last_sequence FROM per_table_cursor WHERE table_name = ?")
            .bind(table)
            .fetch_optional(pool)
            .await?;
    Ok(v.unwrap_or(0))
}

pub async fn set_cursor(pool: &SqlitePool, table: &str, sequence: i64) -> AppResult<()> {
    sqlx::query(
        "INSERT INTO per_table_cursor (table_name, last_sequence) \
         VALUES (?, ?) \
         ON CONFLICT(table_name) DO UPDATE SET \
         last_sequence = MAX(last_sequence, excluded.last_sequence)",
    )
    .bind(table)
    .bind(sequence)
    .execute(pool)
    .await?;
    Ok(())
}
