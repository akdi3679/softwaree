# TASK ID: LOAD-003.1
# TITLE: Add load test: 100 concurrent Users syncing
# STATUS: pending
# DEPENDENCIES: CHAOS-003.3
# ALLOWED FILES: product/apps/admin/src-tauri/tests/load_concurrent_users.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Simulate 100 WebSocket connections reading events. Admin must not slow.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/load_concurrent_users.rs`:

```rust
use product_admin_lib::{commands, db, state, sync};
use std::sync::Arc;
use std::time::Instant;
use tempfile::tempdir;

#[tokio::test]
#[ignore]
async fn hundred_concurrent_users_dont_slow_writes() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_load");
    db::project_db::create(&state.paths, &project_id, "Load", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    // Spawn 100 "users" polling events
    let mut handles = vec![];
    for _ in 0..100 {
        let state = state.clone();
        let project_id = project_id.clone();
        handles.push(tokio::spawn(async move {
            for _ in 0..10 {
                let h = state.projects.read().await.get(&project_id).cloned();
                if let Some(h) = h {
                    let _: Vec<(i64, String)> = sqlx::query_as("SELECT sequence, event_type FROM events ORDER BY sequence DESC LIMIT 1")
                        .fetch_all(&h.db).await.unwrap_or_default();
                }
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        }));
    }

    // Write 1000 events while users are polling
    let start = Instant::now();
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    for i in 0..1000 {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("load{i}@x.com"),
            initial_role: "doctor".into(),
        }).await.unwrap();
    }
    let elapsed = start.elapsed();
    println!("1000 writes with 100 concurrent readers in {elapsed:?}");
    assert!(elapsed.as_secs() < 30, "writes should not slow under load");

    for h in handles { h.await.unwrap(); }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/load_concurrent_users.rs || { echo "FAIL"; exit 1; }
grep -q "hundred_concurrent_users" apps/admin/src-tauri/tests/load_concurrent_users.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
