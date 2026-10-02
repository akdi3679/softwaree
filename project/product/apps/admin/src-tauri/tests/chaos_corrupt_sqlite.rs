//! Chaos test: corrupt a SQLite file, verify detection and recovery path.
//!
//! We do not import the Admin crate internals here. Instead we test the
//! invariant at the SQLite layer: a corrupt file must fail to open; a
//! restored copy of a known-good file must open and contain the same rows.

use sqlx::sqlite::SqlitePoolOptions;

async fn make_good_db(path: &std::path::Path) {
    let url = format!("sqlite://{}", path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open");
    sqlx::query(
        "CREATE TABLE invitations (id TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL)",
    )
    .execute(&pool)
    .await
    .expect("create");
    for i in 0..10 {
        sqlx::query("INSERT INTO invitations (id, email, role) VALUES (?, ?, ?)")
            .bind(format!("inv_{i}"))
            .bind(format!("a{i}@x.com"))
            .bind("doctor")
            .execute(&pool)
            .await
            .expect("insert");
    }
    pool.close().await;
}

#[tokio::test]
async fn corrupt_sqlite_can_be_detected_and_restored() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let live = tmp.path().join("project.sqlite");
    let backup = tmp.path().join("backup.sqlite");

    make_good_db(&live).await;
    std::fs::copy(&live, &backup).expect("backup copy");

    // Corrupt the live file (overwrite first bytes with garbage).
    {
        use std::io::Write;
        let mut f = std::fs::OpenOptions::new()
            .write(true)
            .open(&live)
            .expect("open live");
        f.write_all(b"CORRUPTED_BYTES").expect("write");
        f.sync_all().expect("sync");
    }

    // Opening the corrupted file must fail OR the first query must fail.
    let url = format!("sqlite://{}", live.display());
    let open_result = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await;
    let corrupt_detected = match open_result {
        Err(_) => true,
        Ok(pool) => {
            let q = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM invitations")
                .fetch_one(&pool)
                .await;
            let _ = pool.close().await;
            q.is_err()
        }
    };
    assert!(corrupt_detected, "corrupt file must not silently succeed");

    // Restore from backup.
    std::fs::copy(&backup, &live).expect("restore copy");

    let restored = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open restored");
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM invitations")
        .fetch_one(&restored)
        .await
        .expect("count");
    assert_eq!(count, 10, "restored DB must contain all 10 invitations");
    restored.close().await;
}
