# TASK ID: CHAOS-002.1
# TITLE: Add chaos test: corrupt SQLite and recover from backup
# STATUS: pending
# DEPENDENCIES: PORTAL-002.3
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_corrupt_sqlite.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Simulate a corrupted SQLite file. Verify: backup restore works, audit chain verifies.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_corrupt_sqlite.rs`:

```rust
//! Chaos test: corrupt SQLite, recover from backup.

use product_admin_lib::{commands, db, state, backup};
use tempfile::tempdir;
use std::fs;
use std::io::Write;

#[tokio::test]
async fn recover_from_corrupted_db() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = state::AppState::new_for_test(paths).await.unwrap();

    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    db::project_db::create(&state.paths, &project_id, "Chaos", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    // Write some data
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    for i in 0..10 {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("a{i}@x.com"), initial_role: "doctor".into(),
        }).await.unwrap();
    }

    // Take a backup (in real impl, upload to Cloud)
    let backup_path = tmp.path().join("backup.sqlite");
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    let snapshot = backup::snapshot::build(&handle, &project_id, "Chaos", None).await.unwrap();
    let mut file = fs::File::create(&backup_path).unwrap();
    let db_path: String = sqlx::query_scalar("SELECT file_path FROM projects WHERE id = ?").bind(&project_id).fetch_one(&handle).await.unwrap();
    let db_bytes = std::fs::read(&db_path).unwrap();
    file.write_all(&db_bytes).unwrap();

    // Corrupt the live DB
    {
        let mut file = fs::OpenOptions::new().write(true).open(&db_path).unwrap();
        file.write_all(b"CORRUPTED").unwrap();
    }

    // Try to open it: should fail
    let result = db::project_db::open(&state.paths, &project_id).await;
    assert!(result.is_err(), "corrupted DB should fail to open");

    // Restore from backup
    fs::copy(&backup_path, &db_path).unwrap();

    // Reopen: should work
    let restored = db::project_db::open(&state.paths, &project_id).await;
    assert!(restored.is_ok(), "restored DB should open");

    // Verify the data is intact
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM invitations").fetch_one(&restored.unwrap()).await.unwrap();
    assert_eq!(count, 10);
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_corrupt_sqlite.rs || { echo "FAIL"; exit 1; }
grep -q "recover_from_corrupted_db" apps/admin/src-tauri/tests/chaos_corrupt_sqlite.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
