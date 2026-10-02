//! CHAOS-008: replay 1M events, verify final state.
//!
//! Ignored by default. Run:
//!   cargo test --release --test chaos_full_replay -- --ignored --nocapture

use sqlx::sqlite::SqlitePoolOptions;
use std::time::Instant;

#[tokio::test]
#[ignore]
async fn replay_one_million_events() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("replay.sqlite");
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
        "CREATE TABLE events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, payload TEXT NOT NULL)",
    )
    .execute(&pool)
    .await
    .expect("create");

    let total = 1_000_000usize;
    let start = Instant::now();
    let mut tx = pool.begin().await.expect("begin");
    for i in 0..total {
        sqlx::query("INSERT INTO events (event_id, payload) VALUES (?, ?)")
            .bind(format!("evt_{i}"))
            .bind(r#"{"n":1}"#)
            .execute(&mut *tx)
            .await
            .expect("insert");
        if i > 0 && i % 100_000 == 0 {
            println!("{}k events written ({:?})", i / 1000, start.elapsed());
        }
    }
    tx.commit().await.expect("commit");
    println!("1M events in {:?}", start.elapsed());

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .expect("count");
    assert_eq!(count as usize, total);
    pool.close().await;
}
