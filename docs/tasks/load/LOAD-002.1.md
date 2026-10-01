# TASK ID: LOAD-002.1
# TITLE: Add Admin load test — 1M event writes
# STATUS: pending
# DEPENDENCIES: CHAOS-002.3
# ALLOWED FILES: product/apps/admin/src-tauri/tests/load_million_events.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Test: how long does it take to write 1M events? Should be < 30s.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/load_million_events.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use std::time::Instant;
use tempfile::tempdir;

#[tokio::test]
#[ignore] // run with: cargo test --release --test load_million_events -- --ignored --nocapture
async fn write_million_events() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_loadtest");
    db::project_db::create(&state.paths, &project_id, "Load", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();

    let start = Instant::now();
    for i in 0..1_000_000 {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("user{i}@loadtest.com"),
            initial_role: "doctor".into(),
        }).await.unwrap();
        if i % 100_000 == 0 {
            println!("{}k events in {:?}", i / 1000, start.elapsed());
        }
    }
    let elapsed = start.elapsed();
    println!("1M events in {elapsed:?}");
    // Should be < 30s on a modern machine
    assert!(elapsed.as_secs() < 60, "1M events should take < 60s");
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/load_million_events.rs || { echo "FAIL"; exit 1; }
grep -q "write_million_events" apps/admin/src-tauri/tests/load_million_events.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
