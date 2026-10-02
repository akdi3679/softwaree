//! Food-lab roundtrip: intake a sample, then list it.
//! Same pattern as `module_roundtrip.rs` for medical-reception.

use admin::modules::dispatch::run_command;
use admin::modules::query::run_query;
use serde_json::json;
use sqlx::sqlite::SqlitePoolOptions;

async fn setup_project_db(path: &std::path::Path) -> sqlx::SqlitePool {
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
            aggregate_version INTEGER NOT NULL,
            actor_user_id TEXT NOT NULL,
            device_id TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            correlation_id TEXT,
            causation_id TEXT,
            payload TEXT NOT NULL
         )",
    )
    .execute(&pool)
    .await
    .expect("create events");
    sqlx::query(
        "CREATE TABLE audit_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            occurred_at TEXT NOT NULL,
            actor_user_id TEXT,
            actor_device_id TEXT,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            result TEXT NOT NULL,
            details TEXT,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL
         )",
    )
    .execute(&pool)
    .await
    .expect("create audit");
    pool
}

#[tokio::test]
async fn intake_sample_writes_event() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let db_path = tmp.path().join("proj.sqlite");
    let pool = setup_project_db(&db_path).await;

    let response = run_command(
        &pool,
        "admin",
        "dev-1",
        "sample.intake",
        &json!({
            "client_name": "Acme Foods",
            "sample_type": "water",
            "collected_at": "2026-10-01T10:00:00Z",
            "notes": "Test sample"
        }),
        Some("idem-food-1"),
        None,
    )
    .await
    .expect("intake");

    assert!(
        response.get("sample_id").is_some(),
        "expected sample_id in response: {response}"
    );

    let event_type: String =
        sqlx::query_scalar("SELECT event_type FROM events LIMIT 1")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(event_type, "sample.intaken");

    let audit_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_entries")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(audit_count, 1);

    pool.close().await;
}