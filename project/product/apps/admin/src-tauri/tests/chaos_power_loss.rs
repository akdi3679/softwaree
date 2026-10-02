//! CHAOS-004: committed data survives a process restart.
//!
//! We commit events, drop the pool (simulate crash), reopen, and verify
//! the data is still there. This is the durability half of the ACID test.

use sqlx::sqlite::SqlitePoolOptions;

async fn open(path: &std::path::Path) -> sqlx::SqlitePool {
    let url = format!("sqlite://{}", path.display());
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open")
}

#[tokio::test]
async fn committed_data_survives_power_loss() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("power.sqlite");

    {
        let pool = open(&path).await;
        sqlx::query("PRAGMA journal_mode=WAL")
            .execute(&pool)
            .await
            .expect("wal");
        sqlx::query(
            "CREATE TABLE events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE)",
        )
        .execute(&pool)
        .await
        .expect("create");
        for i in 0..100 {
            sqlx::query("INSERT INTO events (event_id) VALUES (?)")
                .bind(format!("evt_{i}"))
                .execute(&pool)
                .await
                .expect("insert");
        }
        // "crash": drop the pool without a clean shutdown.
        drop(pool);
    }

    // Reopen.
    let pool = open(&path).await;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .expect("count");
    assert_eq!(count, 100, "all committed events must survive restart");
    pool.close().await;
}
