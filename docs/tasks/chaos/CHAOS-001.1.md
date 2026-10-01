# TASK ID: CHAOS-001.1
# TITLE: Add chaos test: kill Admin mid-write
# STATUS: pending
# DEPENDENCIES: ANALYTICS-001.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_kill_admin.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Test: simulate the Admin crashing mid-transaction. Verify: no partial events, audit chain still valid, no orphan data.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_kill_admin.rs`:

```rust
//! Chaos test: simulate Admin crash mid-write.
//! Run with: cargo test --test chaos_kill_admin

use product_admin_lib::{commands, db, state};
use std::sync::Arc;
use std::time::Duration;
use tempfile::tempdir;
use tokio::time::sleep;

#[tokio::test]
async fn kill_admin_mid_write_recovers() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths {
        data_dir: tmp.path().to_path_buf(),
        projects_dir: tmp.path().join("projects"),
        keys_dir: tmp.path().join("keys"),
        modules_dir: tmp.path().join("modules"),
        logs_dir: tmp.path().join("logs"),
        tailscale_state: tmp.path().join("tailscale"),
    };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = state::AppState::new_for_test(paths).await.unwrap();
    let state = Arc::new(state);

    // 1. Create a project
    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    db::project_db::create(&state.paths, &project_id, "Chaos", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    {
        let mut projects = state.projects.write().await;
        projects.insert(project_id.clone(), handle);
    }
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();

    // 2. Start 100 commands in parallel
    let mut handles = vec![];
    for i in 0..100 {
        let h = handle.clone();
        handles.push(tokio::spawn(async move {
            let _ = commands::handlers::invite_user(&h, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
                email: format!("chaos{i}@example.com"),
                initial_role: "doctor".into(),
            }).await;
        }));
    }

    // 3. Wait some, then SIMULATE KILL: drop the AppState
    sleep(Duration::from_millis(20)).await;
    drop(state);

    // 4. Wait for all tasks (some may fail because we dropped state)
    for h in handles { let _ = h.await; }

    // 5. Reopen the DB and verify integrity
    let handle = db::project_db::open(&state.paths, &project_id).await.unwrap();
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM invitations").fetch_one(&handle).await?;
    let event_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&handle).await?;
    let audit_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_entries").fetch_one(&handle).await?;
    // Invitations and events must be 1:1 (transactional outbox)
    assert_eq!(count, event_count, "every invitation must have an event");
    // Every event must have an audit entry
    assert_eq!(event_count, audit_count, "every event must have an audit entry");

    // 6. Audit chain must be valid
    let (last_id, valid, total) = crate::audit::writer::verify_chain(&handle).await.unwrap();
    assert_eq!(valid, total, "audit chain must be valid after crash recovery");
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_kill_admin.rs || { echo "FAIL"; exit 1; }
grep -q "kill_admin_mid_write_recovers" apps/admin/src-tauri/tests/chaos_kill_admin.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
