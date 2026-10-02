//! LOAD-002: 1M event writes through a realistic per-insert path.
//!
//! Ignored by default. Run:
//!   cargo test --release --test load_million_events -- --ignored --nocapture

use sqlx::sqlite::SqlitePoolOptions;
use std::time::Instant;

#[tokio::test]
#[ignore]
async fn million_event_writes_through_one_insert_at_a_time() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("million.sqlite");
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open");
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&pool)
        .await
        .expect("wal");
    sqlx::query("PRAGMA synchronous=NORMAL")
        .execute(&pool)
        .await
        .expect("sync");
    sqlx::query(
        "CREATE TABLE events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, occurred_at TEXT NOT NULL, payload TEXT NOT NULL)",
    )
    .execute(&pool)
    .await
    .expect("create");

    let total = 1_000_000usize;
    let start = Instant::now();
    for i in 0..total {
        sqlx::query("INSERT INTO events (event_id, occurred_at, payload) VALUES (?, ?, ?)")
            .bind(format!("evt_{i}"))
            .bind("2026-01-01T00:00:00Z")
            .bind(r#"{"n":1}"#)
            .execute(&pool)
            .await
            .expect("insert");
        if i > 0 && i % 100_000 == 0 {
            println!("{}k ({:?})", i / 1000, start.elapsed());
        }
    }
    let elapsed = start.elapsed();
    let rate = total as f64 / elapsed.as_secs_f64();
    println!("1M inserts in {elapsed:?} ({rate:.0}/sec)");
    assert!(rate > 500.0, "must sustain > 500 inserts/sec");
    pool.close().await;
}
