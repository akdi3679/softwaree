# TASK ID: CHAOS-003.2
# TITLE: Add chaos: our mesh not connected at startup
# STATUS: pending
# DEPENDENCIES: CHAOS-003.1
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_no_tailscale.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Start app with our mesh not running. App must not crash; sync retries.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_no_tailscale.rs`:

```rust
use product_admin_lib::{state, sync};
use std::sync::Arc;
use tempfile::tempdir;

#[tokio::test]
async fn no_tailscale_does_not_crash() {
    let tmp = tempdir().unwrap();
    let paths = state::AppPaths { data_dir: tmp.path().to_path_buf(), projects_dir: tmp.path().join("projects"), keys_dir: tmp.path().join("keys"), modules_dir: tmp.path().join("modules"), logs_dir: tmp.path().join("logs"), tailscale_state: tmp.path().join("tailscale") };
    std::fs::create_dir_all(&paths.projects_dir).unwrap();
    let state = Arc::new(state::AppState::new_for_test(paths).await.unwrap());

    // Verify tailscale status (no daemon running, expect false)
    let online = sync::mesh::is_online().await;
    assert!(!online, "no daemon running");

    // Try to start sync; should fail gracefully
    let result = sync::start(state.clone()).await;
    assert!(result.is_err(), "should not start without tailscale");

    // Verify state still healthy
    let active = state.projects.read().await.len();
    assert_eq!(active, 0);
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_no_tailscale.rs || { echo "FAIL"; exit 1; }
grep -q "no_tailscale" apps/admin/src-tauri/tests/chaos_no_tailscale.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
