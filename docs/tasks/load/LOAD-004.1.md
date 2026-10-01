# TASK ID: LOAD-004.1
# TITLE: Add load test: 10K events/sec sustained
# STATUS: pending
# DEPENDENCIES: CLOUD-013.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/load_sustained.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Sustained throughput test. Real-world worst case.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/load_sustained.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use std::time::Instant;
use tempfile::tempdir;

#[tokio::test]
#[ignore]
async fn sustained_throughput() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_load_sustained");
    db::project_db::create(&state.paths, &project_id, "Load", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    let total = 100_000;
    let start = Instant::now();
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    for i in 0..total {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("load{i}@x.com"),
            initial_role: "doctor".into(),
        }).await.unwrap();
        if i % 10_000 == 0 {
            println!("{}k in {:?}", i / 1000, start.elapsed());
        }
    }
    let elapsed = start.elapsed();
    let rate = total as f64 / elapsed.as_secs_f64();
    println!("Sustained: {:.0} events/sec", rate);
    assert!(rate > 1000.0, "should sustain > 1K events/sec");
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/load_sustained.rs || { echo "FAIL"; exit 1; }
grep -q "sustained_throughput" apps/admin/src-tauri/tests/load_sustained.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
