//! LOAD-003: 100 concurrent readers + 1000 writes must complete < 30s.

use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use std::time::Instant;

#[tokio::test]
async fn hundred_concurrent_readers_dont_slow_writes() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("load.sqlite");
    let url = format!("sqlite://{}", path.display());
    let pool = Arc::new(
        SqlitePoolOptions::new()
            .max_connections(16)
            .connect(&url)
            .await
            .expect("open"),
    );
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&*pool)
        .await
        .expect("wal");
    sqlx::query(
        "CREATE TABLE events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, payload TEXT NOT NULL)",
    )
    .execute(&*pool)
    .await
    .expect("create");

    let mut readers = Vec::new();
    for _ in 0..100 {
        let p = pool.clone();
        readers.push(tokio::spawn(async move {
            for _ in 0..10 {
                let _: Result<Option<i64>, _> =
                    sqlx::query_scalar("SELECT MAX(sequence) FROM events")
                        .fetch_optional(&*p)
                        .await;
                tokio::time::sleep(std::time::Duration::from_millis(20)).await;
            }
        }));
    }

    let start = Instant::now();
    for i in 0..1000 {
        sqlx::query("INSERT INTO events (event_id, payload) VALUES (?, ?)")
            .bind(format!("evt_{i}"))
            .bind(r#"{"n":1}"#)
            .execute(&*pool)
            .await
            .expect("insert");
    }
    let elapsed = start.elapsed();
    println!("1000 writes with 100 concurrent readers in {elapsed:?}");
    assert!(elapsed.as_secs() < 30, "writes must complete under 30s");

    for r in readers {
        let _ = r.await;
    }
    pool.close().await;
}
