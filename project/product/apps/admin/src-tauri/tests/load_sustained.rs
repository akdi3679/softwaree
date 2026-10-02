//! Load test: sustained write throughput on the events table.
//!
//! Ignored by default because it writes 100,000 rows.
//! Run with:
//!   cargo test --release --test load_sustained -- --ignored --nocapture

use sqlx::sqlite::SqlitePoolOptions;
use std::time::Instant;

#[tokio::test]
#[ignore]
async fn sustained_100k_events() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("sustained.sqlite");
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
    .expect("create");

    let total: usize = 100_000;
    let start = Instant::now();
    let mut tx = pool.begin().await.expect("begin");
    for i in 0..total {
        sqlx::query(
            "INSERT INTO events (event_id, event_type, occurred_at, payload) VALUES (?, ?, ?, ?)",
        )
        .bind(format!("evt_{i}"))
        .bind("bench.appended")
        .bind("2026-01-01T00:00:00Z")
        .bind(r#"{"n":1}"#)
        .execute(&mut *tx)
        .await
        .expect("insert");
        if i % 10_000 == 0 && i > 0 {
            println!("{}k in {:?}", i / 1000, start.elapsed());
        }
    }
    tx.commit().await.expect("commit");

    let elapsed = start.elapsed();
    let rate = total as f64 / elapsed.as_secs_f64();
    println!("Sustained: {:.0} events/sec ({:?} total)", rate, elapsed);
    assert!(rate > 1000.0, "must sustain > 1K events/sec (was {:.0})", rate);

    pool.close().await;
}
