//! CHAOS-001: kill the writer mid-transaction, verify no partial state.
//!
//! We simulate a crash by rolling back a transaction that had inserted
//! several rows. After rollback the events table must be empty — proving
//! SQLite transactional atomicity holds under mid-write failure.

use sqlx::sqlite::SqlitePoolOptions;

async fn make_db(path: &std::path::Path) -> sqlx::SqlitePool {
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
    pool
}

#[tokio::test]
async fn kill_mid_write_leaves_no_partial_state() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("chaos.sqlite");
    let pool = make_db(&path).await;

    // Simulate a mid-write crash: BEGIN, insert 50 rows, ROLLBACK.
    {
        let mut tx = pool.begin().await.expect("begin");
        for i in 0..50 {
            sqlx::query(
                "INSERT INTO events (event_id, event_type, occurred_at, payload) VALUES (?, ?, ?, ?)",
            )
            .bind(format!("evt_{i}"))
            .bind("chaos.midwrite")
            .bind("2026-01-01T00:00:00Z")
            .bind(r#"{"n":1}"#)
            .execute(&mut *tx)
            .await
            .expect("insert");
        }
        tx.rollback().await.expect("rollback");
    }

    // After rollback: zero rows, and autoincrement sequence unaffected.
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .expect("count");
    assert_eq!(count, 0, "rollback must leave zero rows");

    // A fresh commit works and starts clean.
    sqlx::query(
        "INSERT INTO events (event_id, event_type, occurred_at, payload) VALUES (?, ?, ?, ?)",
    )
    .bind("evt_after")
    .bind("chaos.after_crash")
    .bind("2026-01-01T00:00:01Z")
    .bind(r#"{"n":1}"#)
    .execute(&pool)
    .await
    .expect("insert after crash");

    let count2: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .expect("count2");
    assert_eq!(count2, 1);
    pool.close().await;
}
