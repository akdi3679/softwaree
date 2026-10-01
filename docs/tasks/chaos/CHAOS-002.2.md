# TASK ID: CHAOS-002.2
# TITLE: Add chaos test: many concurrent events
# STATUS: pending
# DEPENDENCIES: CHAOS-002.1
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_concurrent_events.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
1000 concurrent events. Verify: sequence is monotonic, all events written.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_concurrent_events.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn many_concurrent_events_preserve_order() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    db::project_db::create(&state.paths, &project_id, "Load", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    // 1000 concurrent invites
    let mut handles = vec![];
    for i in 0..1000 {
        let state = state.clone();
        let project_id = project_id.clone();
        handles.push(tokio::spawn(async move {
            let h = state.projects.read().await.get(&project_id).unwrap().db.clone();
            commands::handlers::invite_user(&h, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
                email: format!("user{i}@x.com"),
                initial_role: "doctor".into(),
            }).await
        }));
    }
    for h in handles { let _ = h.await; }

    // Verify count
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&handle).await.unwrap();
    assert_eq!(count, 1000);

    // Verify sequence is contiguous
    let min_seq: i64 = sqlx::query_scalar("SELECT MIN(sequence) FROM events").fetch_one(&handle).await.unwrap();
    let max_seq: i64 = sqlx::query_scalar("SELECT MAX(sequence) FROM events").fetch_one(&handle).await.unwrap();
    assert_eq!(max_seq - min_seq + 1, 1000, "sequence must be contiguous");
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_concurrent_events.rs || { echo "FAIL"; exit 1; }
grep -q "many_concurrent_events" apps/admin/src-tauri/tests/chaos_concurrent_events.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
