//! C14: backup restore drill - integration test.
//!
//! Builds a real SQLite database with events, runs the drill against it,
//! and verifies the report. Runs entirely in a tempdir. No environment,
//! no Cloud, no network.

use std::path::Path;

use admin::backup::restore_drill::drill_one;
use sqlx::sqlite::SqlitePoolOptions;

async fn make_project_db(path: &Path, event_count: usize) {
    let url = format!("sqlite://{}?mode=rwc", path.display());
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
            aggregate_type TEXT NOT NULL,
            aggregate_id TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            payload TEXT NOT NULL
         )",
    )
    .execute(&pool)
    .await
    .expect("create events");

    for i in 0..event_count {
        sqlx::query(
            "INSERT INTO events \
             (event_id, event_type, aggregate_type, aggregate_id, occurred_at, payload) \
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(format!("evt_{i}"))
        .bind("patient.created")
        .bind("patient")
        .bind(format!("pat_{i}"))
        .bind(chrono::Utc::now().to_rfc3339())
        .bind(r#"{"full_name":"Test"}"#)
        .execute(&pool)
        .await
        .expect("insert");
    }

    pool.close().await;
}

#[tokio::test]
async fn drill_reads_backup_and_reports_count() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let backup = tmp.path().join("proj_test-backup.sqlite");
    make_project_db(&backup, 100).await;

    let report = drill_one(&backup).await.expect("drill");
    assert!(report.ok, "drill reports failure");
    assert_eq!(report.event_count, 100);
    assert_eq!(report.backup_path, backup.to_string_lossy().to_string());
    assert!(!report.checked_at.is_empty());
}

#[tokio::test]
async fn drill_missing_file_errors() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let missing = tmp.path().join("does-not-exist.sqlite");
    let err = drill_one(&missing).await.unwrap_err();
    let msg = format!("{err}");
    assert!(
        msg.contains("not found") || msg.contains("does-not-exist"),
        "unexpected error: {msg}"
    );
}

#[tokio::test]
async fn drill_reports_failure_on_non_sqlite_file() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let bogus = tmp.path().join("bogus.sqlite");
    std::fs::write(&bogus, b"this is not a sqlite database").expect("write");

    // The drill opens the file; SQLite may or may not fail at open, but
    // the events table will not exist, so event_count comes back as -1
    // and `ok` is false (or the query returns an error and we surface it).
    match drill_one(&bogus).await {
        Ok(report) => {
            // If it opened, the table should not exist, so ok must be false.
            assert!(!report.ok, "expected failure on bogus file, got {report:?}");
        }
        Err(_) => {
            // Opening failed outright - also acceptable.
        }
    }
}