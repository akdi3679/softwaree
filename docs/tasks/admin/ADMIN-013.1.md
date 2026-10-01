# TASK ID: ADMIN-013.1
# TITLE: Add Admin integration tests (real Tauri commands)
# STATUS: pending
# DEPENDENCIES: SECURITY-002.4
# ALLOWED FILES: product/apps/admin/src-tauri/tests/commands_e2e.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
End-to-end tests that exercise the full Tauri command path (state, command, event, audit).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/commands_e2e.rs`:

```rust
//! E2E tests for the Admin's Tauri commands.
//! Run with: cargo test --test commands_e2e

use product_admin_lib::{
    commands, db, state, crypto, error::AppResult,
};
use sqlx::SqlitePool;
use tempfile::tempdir;
use std::sync::Arc;

async fn setup() -> (Arc<state::AppState>, tempfile::TempDir) {
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
    (Arc::new(state), tmp)
}

async fn open_test_project(state: &state::AppState, name: &str) -> String {
    let project_id = format!("proj_{}", uuid::Uuid::new_v4().simple());
    let _handle = db::project_db::create(&state.paths, &project_id, name, "medical_reception")
        .await.unwrap();
    let mut projects = state.projects.write().await;
    projects.insert(project_id.clone(), db::project_db::ProjectHandle {
        db: db::project_db::open(&state.paths, &project_id).await.unwrap(),
    });
    project_id
}

#[tokio::test]
async fn test_invite_then_create_user() -> AppResult<()> {
    let (state, _tmp) = setup().await;
    let project_id = open_test_project(&state, "Test Project").await;
    let actor = "usr_admin";
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();

    // Invite
    let inv = commands::handlers::invite_user(&handle, actor, "dev_1", commands::handlers::InviteUserRequest {
        email: "alice@example.com".to_string(),
        initial_role: "doctor".to_string(),
    }).await?;

    assert!(inv.token.starts_with("inv_") || inv.token.len() == 43); // URL-safe base64 32 bytes
    assert!(!inv.invitation_id.is_empty());

    // Simulate acceptance
    commands::handlers::create_user(&handle, actor, "dev_1", commands::handlers::CreateUserRequest {
        email: "alice@example.com".to_string(),
        display_name: "Alice".to_string(),
        initial_role: "doctor".to_string(),
    }).await?;

    // Verify user is in DB
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE email = ?")
        .bind("alice@example.com")
        .fetch_one(&handle)
        .await?;
    assert_eq!(count, 1);
    Ok(())
}

#[tokio::test]
async fn test_event_sequence_monotonic() -> AppResult<()> {
    let (state, _tmp) = setup().await;
    let project_id = open_test_project(&state, "Test").await;
    let actor = "usr_admin";
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();

    for i in 0..10 {
        commands::handlers::invite_user(&handle, actor, "dev_1", commands::handlers::InviteUserRequest {
            email: format!("user{i}@example.com"),
            initial_role: "doctor".to_string(),
        }).await?;
    }
    let last: i64 = sqlx::query_scalar("SELECT MAX(sequence) FROM events")
        .fetch_one(&handle)
        .await?;
    assert!(last >= 10);
    Ok(())
}

#[tokio::test]
async fn test_audit_chain_valid() -> AppResult<()> {
    let (state, _tmp) = setup().await;
    let project_id = open_test_project(&state, "Test").await;
    let actor = "usr_admin";
    let handle = state.projects.read().await.get(&project_id).unwrap().db.clone();

    for i in 0..5 {
        commands::handlers::invite_user(&handle, actor, "dev_1", commands::handlers::InviteUserRequest {
            email: format!("u{i}@x.com"),
            initial_role: "doctor".to_string(),
        }).await?;
    }
    let result = crate::audit::writer::verify_chain(&handle).await?;
    assert_eq!(result.1, 5); // valid count
    assert_eq!(result.2, 5); // total count
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/commands_e2e.rs || { echo "FAIL"; exit 1; }
grep -q "test_invite_then_create_user" apps/admin/src-tauri/tests/commands_e2e.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
