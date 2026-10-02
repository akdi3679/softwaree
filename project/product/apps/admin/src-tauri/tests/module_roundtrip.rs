//! Patient roundtrip: create a patient via the module, then read it
//! back through the query path. Runs entirely in a tempdir.

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
async fn create_patient_writes_event_and_audit() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let db_path = tmp.path().join("proj.sqlite");
    let pool = setup_project_db(&db_path).await;

    let response = run_command(
        &pool,
        "admin",
        "dev-1",
        "patient.create",
        &json!({
            "full_name": "Jane Doe",
            "phone": "+15551234567",
            "date_of_birth": "1990-01-15"
        }),
        Some("idem-1"),
        None,
    )
    .await
    .expect("command");

    assert!(response.get("patient_id").is_some());

    let event_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(event_count, 1, "expected exactly one event");

    let audit_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_entries")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(audit_count, 1, "expected exactly one audit entry");

    let event_type: String =
        sqlx::query_scalar("SELECT event_type FROM events LIMIT 1")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(event_type, "patient.created");

    pool.close().await;
}

#[tokio::test]
async fn list_patients_returns_created_patients() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let db_path = tmp.path().join("proj.sqlite");
    let pool = setup_project_db(&db_path).await;

    for (name, phone) in [
        ("Jane Doe", "+15551234567"),
        ("John Smith", "+15559876543"),
    ] {
        run_command(
            &pool,
            "admin",
            "dev-1",
            "patient.create",
            &json!({
                "full_name": name,
                "phone": phone,
                "date_of_birth": "1985-06-20"
            }),
            None,
            None,
        )
        .await
        .expect("create");
    }

    let response = run_query(&pool, "patient.list", &json!({}))
        .await
        .expect("query");
    let patients = response.as_array().expect("array");
    assert_eq!(patients.len(), 2);
    let names: Vec<String> = patients
        .iter()
        .filter_map(|p| p.get("full_name").and_then(|n| n.as_str()).map(String::from))
        .collect();
    assert!(names.contains(&"Jane Doe".to_string()));
    assert!(names.contains(&"John Smith".to_string()));

    pool.close().await;
}

#[tokio::test]
async fn rejected_command_writes_nothing() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let db_path = tmp.path().join("proj.sqlite");
    let pool = setup_project_db(&db_path).await;

    // Missing date_of_birth should be rejected by the module.
    let result = run_command(
        &pool,
        "admin",
        "dev-1",
        "patient.create",
        &json!({
            "full_name": "Bad Patient",
            "phone": "+15551234567",
            "date_of_birth": ""
        }),
        None,
        None,
    )
    .await;

    assert!(result.is_err(), "expected validation error");

    let event_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(event_count, 0, "no events should be written on error");

    let audit_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_entries")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(audit_count, 0, "no audit should be written on error");

    pool.close().await;
}