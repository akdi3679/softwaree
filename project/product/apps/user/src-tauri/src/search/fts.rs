use sqlx::SqlitePool;

use crate::error::AppResult;

#[derive(Debug, Clone, serde::Serialize)]
pub struct SearchResult {
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub title: String,
    pub body: String,
    pub rank: f64,
}

pub async fn index(
    pool: &SqlitePool,
    aggregate_type: &str,
    aggregate_id: &str,
    title: &str,
    body: &str,
) -> AppResult<()> {
    sqlx::query("DELETE FROM search_index WHERE aggregate_type = ? AND aggregate_id = ?")
        .bind(aggregate_type)
        .bind(aggregate_id)
        .execute(pool)
        .await?;
    sqlx::query(
        "INSERT INTO search_index (aggregate_type, aggregate_id, title, body) VALUES (?, ?, ?, ?)",
    )
    .bind(aggregate_type)
    .bind(aggregate_id)
    .bind(title)
    .bind(body)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn search(pool: &SqlitePool, query: &str, limit: i64) -> AppResult<Vec<SearchResult>> {
    let escaped = escape_fts_query(query);
    let rows: Vec<(String, String, String, String, f64)> = sqlx::query_as(
        "SELECT aggregate_type, aggregate_id, title, body, rank FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT ?",
    )
    .bind(&escaped)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(a, i, t, b, r)| SearchResult {
            aggregate_type: a,
            aggregate_id: i,
            title: t,
            body: b,
            rank: r,
        })
        .collect())
}

fn escape_fts_query(q: &str) -> String {
    format!("\"{}\"", q.replace('"', "\"\""))
}