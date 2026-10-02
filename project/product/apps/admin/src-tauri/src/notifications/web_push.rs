use sqlx::SqlitePool;

use crate::error::AppResult;

pub async fn store_subscription(pool: &SqlitePool, json: &str) -> AppResult<()> {
    sqlx::query(
        "INSERT OR REPLACE INTO push_subscriptions (id, subscription_json, created_at) VALUES (1, ?, CURRENT_TIMESTAMP)",
    )
    .bind(json)
    .execute(pool)
    .await?;
    Ok(())
}