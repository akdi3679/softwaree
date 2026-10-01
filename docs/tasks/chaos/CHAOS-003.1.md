# TASK ID: CHAOS-003.1
# TITLE: Add chaos: disk full during backup
# STATUS: pending
# DEPENDENCIES: MEDICAL-006.3
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_disk_full.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Simulate disk full, verify backup fails cleanly without corrupting state.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_disk_full.rs`:

```rust
use product_admin_lib::{backup, commands, db, state};
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn disk_full_during_backup_fails_cleanly() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
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

    // Make output dir read-only so writes fail
    let out_dir = tmp.path().join("readonly");
    std::fs::create_dir_all(&out_dir).unwrap();
    let mut perms = std::fs::metadata(&out_dir).unwrap().permissions();
    perms.set_readonly(true);
    std::fs::set_permissions(&out_dir, perms).unwrap();

    // Attempt backup
    let result = backup::run(&state, project_id.clone()).await;
    assert!(result.is_err(), "backup should fail when output dir is read-only");

    // Verify state is intact
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&handle).await.unwrap();
    assert_eq!(count, 10);

    // Restore permissions
    let mut perms = std::fs::metadata(&out_dir).unwrap().permissions();
    perms.set_readonly(false);
    std::fs::set_permissions(&out_dir, perms).unwrap();
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_disk_full.rs || { echo "FAIL"; exit 1; }
grep -q "disk_full" apps/admin/src-tauri/tests/chaos_disk_full.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
