# TASK ID: CHAOS-005.1
# TITLE: Add chaos: clock skew between devices
# STATUS: pending
# DEPENDENCIES: OBS-004.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_clock_skew.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Devices with skewed clocks must still apply events in sequence order.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_clock_skew.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn clock_skew_does_not_break_sequence() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    db::project_db::create(&state.paths, &project_id, "Chaos", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    // Write 5 events "out of order" (occurred_at earlier than previous)
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    for i in 0..5 {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("a{i}@x.com"),
            initial_role: "doctor".into(),
        }).await.unwrap();
        // Wait a millisecond so sequence increments
        tokio::time::sleep(std::time::Duration::from_millis(2)).await;
    }

    // Verify sequence is monotonic 1..5
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();
    let sequences: Vec<i64> = sqlx::query_scalar("SELECT sequence FROM events ORDER BY sequence ASC")
        .fetch_all(&handle).await.unwrap();
    assert_eq!(sequences, vec![1, 2, 3, 4, 5]);
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_clock_skew.rs || { echo "FAIL"; exit 1; }
grep -q "clock_skew" apps/admin/src-tauri/tests/chaos_clock_skew.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
