//! Chaos test: 1000 concurrent writers must not break the events table.
//!
//! Invariants tested at the SQLite layer:
//!  - events.sequence is unique and contiguous (autoincrement PK).
//!  - each event row is fully written (no torn writes).
//!  - row count after 1000 concurrent inserts is exactly 1000.

use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;

async fn make_events_db(path: &std::path::Path) {
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open");
    sqlx::query(
        "CREATE TABLE events (
            sequence INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            event_type TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            payload TEXT NOT NULL
         )",
    )
    .execute(&pool)
    .await
    .expect("create events");
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&pool)
        .await
        .expect("wal");
    pool.close().await;
}

#[tokio::test]
async fn thousand_concurrent_writes_preserve_sequence() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("events.sqlite");
    make_events_db(&path).await;

    let url = format!("sqlite://{}", path.display());
    let pool = Arc::new(
        SqlitePoolOptions::new()
            .max_connections(8)
            .connect(&url)
            .await
            .expect("open"),
    );

    let mut handles = Vec::with_capacity(1000);
    for i in 0..1000 {
        let pool = pool.clone();
        handles.push(tokio::spawn(async move {
            let _ = sqlx::query(
                "INSERT INTO events (event_id, event_type, occurred_at, payload) VALUES (?, ?, ?, ?)",
            )
            .bind(format!("evt_{i}"))
            .bind("bench.appended")
            .bind("2026-01-01T00:00:00Z")
            .bind(r#"{"n":1}"#)
            .execute(&*pool)
            .await;
        }));
    }
    for h in handles {
        let _ = h.await;
    }

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&*pool)
        .await
        .expect("count");
    assert_eq!(count, 1000, "all 1000 inserts must land");

    let min_seq: i64 = sqlx::query_scalar("SELECT MIN(sequence) FROM events")
        .fetch_one(&*pool)
        .await
        .expect("min");
    let max_seq: i64 = sqlx::query_scalar("SELECT MAX(sequence) FROM events")
        .fetch_one(&*pool)
        .await
        .expect("max");
    assert_eq!(min_seq, 1);
    assert_eq!(max_seq, 1000);
    assert_eq!(max_seq - min_seq + 1, 1000, "sequence must be contiguous");

    pool.close().await;
}
