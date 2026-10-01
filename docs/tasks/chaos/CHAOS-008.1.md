# TASK ID: CHAOS-008.1
# TITLE: Add chaos: replay 1M events into a fresh project
# STATUS: pending
# DEPENDENCIES: ADMIN-037.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_full_replay.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Open a backup on a fresh Admin, replay 1M events. Verify final state matches.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_full_replay.rs`:

```rust
use product_admin_lib::{commands, db, state};
use std::time::Instant;
use tempfile::tempdir;

#[tokio::test]
#[ignore]
async fn full_replay_into_fresh_db() {
    let tmp_src = tempdir().unwrap();
    let tmp_dst = tempdir().unwrap();
    let paths_src = state::AppPaths { data_dir: tmp_src.path().to_path_buf(), projects_dir: tmp_src.path().join("projects"), keys_dir: tmp_src.path().join("keys"), modules_dir: tmp_src.path().join("modules"), logs_dir: tmp_src.path().join("logs"), tailscale_state: tmp_src.path().join("tailscale") };
    let paths_dst = state::AppPaths { data_dir: tmp_dst.path().to_path_buf(), projects_dir: tmp_dst.path().join("projects"), keys_dir: tmp_dst.path().join("keys"), modules_dir: tmp_dst.path().join("modules"), logs_dir: tmp_dst.path().join("logs"), tailscale_state: tmp_dst.path().join("tailscale") };
    std::fs::create_dir_all(&paths_src.projects_dir).unwrap();
    std::fs::create_dir_all(&paths_dst.projects_dir).unwrap();
    let state_src = state::AppState::new_for_test(paths_src).await.unwrap();
    let project_id = format!("proj_replay");
    db::project_db::create(&state_src.paths, &project_id, "Replay", "medical_reception").await.unwrap();
    let handle = db::project_db::open(&state_src.paths, &project_id).await.unwrap();
    state_src.projects.write().await.insert(project_id.clone(), handle);
    let handle = state_src.projects.read().await.get(&project_id).unwrap().db.clone();
    for i in 0..1_000_000 {
        commands::handlers::invite_user(&handle, "usr_admin", "dev_1", commands::handlers::InviteUserRequest {
            email: format!("a{i}@x.com"), initial_role: "doctor".into(),
        }).await.unwrap();
    }
    // Snapshot the final sequence
    let final_seq: i64 = sqlx::query_scalar("SELECT MAX(sequence) FROM events").fetch_one(&handle).await.unwrap();
    // Restore into fresh dst
    let src_db_path: String = sqlx::query_scalar("SELECT file_path FROM projects WHERE id = ?").bind(&project_id).fetch_one(&handle).await.unwrap();
    let dst_db = paths_dst.projects_dir.join(format!("{project_id}.sqlite"));
    std::fs::copy(&src_db_path, &dst_db).unwrap();
    let state_dst = state::AppState::new_for_test(paths_dst).await.unwrap();
    let handle = db::project_db::open(&state_dst.paths, &project_id).await.unwrap();
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&handle).await.unwrap();
    let max_seq: i64 = sqlx::query_scalar("SELECT MAX(sequence) FROM events").fetch_one(&handle).await.unwrap();
    let start = Instant::now();
    crate::audit::verify_chain(&handle).await.unwrap();
    println!("chain verify for 1M events in {:?}", start.elapsed());
    assert_eq!(count, 1_000_000);
    assert_eq!(max_seq, final_seq);
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_full_replay.rs || { echo "FAIL"; exit 1; }
grep -q "full_replay" apps/admin/src-tauri/tests/chaos_full_replay.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
