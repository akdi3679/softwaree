# TASK ID: CHAOS-004.1
# TITLE: Add chaos: power loss during command write
# STATUS: pending
# DEPENDENCIES: CLOUD-011.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_power_loss.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Simulate power loss between writing the event and updating outbox.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_power_loss.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn power_loss_after_event_write_recovers() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());
    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    db::project_db::create(&state.paths, &project_id, "Chaos", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), handle);

    // Write 3 commands
    for i in 0..3 {
        let h = state.projects.read().await.get(&project_id).unwrap().db.clone();
        commands::handlers::invite_user(&h, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("a{i}@x.com"),
            initial_role: "doctor".into(),
        }).await.unwrap();
    }

    // Simulate "crash" — drop state, reopen
    drop(state);
    let paths2 = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    let state = state::AppState::new_for_test(paths2).await.unwrap();
    state.projects.write().await.insert(project_id.clone(), state::ProjectHandle::default());

    // The outbox dispatcher should pick up undispatched events
    let dispatcher = crate::outbox::Dispatcher::new(state.clone());
    let n = dispatcher.dispatch_due().await.unwrap();
    assert!(n >= 3, "should redispatch events after recovery");
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_power_loss.rs || { echo "FAIL"; exit 1; }
grep -q "power_loss" apps/admin/src-tauri/tests/chaos_power_loss.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
