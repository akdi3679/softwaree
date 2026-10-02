//! Chaos test: events written with skewed occurred_at still arrive in
//! sequence order because the sequence column is the source of ordering,
//! not the wall-clock timestamp.

use sqlx::sqlite::SqlitePoolOptions;

#[tokio::test]
async fn clock_skew_does_not_break_sequence_order() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let path = tmp.path().join("skew.sqlite");
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open");

    sqlx::query(
        "CREATE TABLE events (
            sequence INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            occurred_at TEXT NOT NULL
         )",
    )
    .execute(&pool)
    .await
    .expect("create");

    // Write 5 events with occurred_at intentionally out of order.
    // 2026-01-01, 2025-12-31, 2026-02-01, 2025-11-01, 2026-03-01
    let times = [
        "2026-01-01T00:00:00Z",
        "2025-12-31T00:00:00Z",
        "2026-02-01T00:00:00Z",
        "2025-11-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
    ];
    for (i, t) in times.iter().enumerate() {
        sqlx::query("INSERT INTO events (event_type, occurred_at) VALUES (?, ?)")
            .bind(format!("evt_{i}"))
            .bind(t)
            .execute(&pool)
            .await
            .expect("insert");
    }

    // Sequence order must be 1..5 regardless of occurred_at.
    let seqs: Vec<i64> = sqlx::query_scalar("SELECT sequence FROM events ORDER BY sequence ASC")
        .fetch_all(&pool)
        .await
        .expect("select");
    assert_eq!(seqs, vec![1, 2, 3, 4, 5]);

    // And when we order by occurred_at, the sequence must NOT be monotonic —
    // this proves skew is present and that ordering by sequence is the correct
    // choice for delivery.
    let by_time: Vec<i64> = sqlx::query_scalar("SELECT sequence FROM events ORDER BY occurred_at ASC")
        .fetch_all(&pool)
        .await
        .expect("select by time");
    assert_ne!(by_time, vec![1, 2, 3, 4, 5], "skew must be visible in time order");

    pool.close().await;
}
