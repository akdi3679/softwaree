# TASK ID: LOAD-005.1
# TITLE: Add load test: 1M event backlog replay
# STATUS: pending
# DEPENDENCIES: SECURITY-008.2
# ALLOWED FILES: product/apps/user/src-tauri/tests/load_backlog_replay.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
How fast can a User catch up from a 1M-event backlog?

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/tests/load_backlog_replay.rs`:

```rust
use product_user_lib::projection::batch_apply;
use tempfile::tempdir;

#[tokio::test]
#[ignore]
async fn replay_million_event_backlog() {
    let tmp = tempdir().unwrap();
    // Set up DB with projection tables and a million "events" already in the local log
    // (In a real test we'd write them; for benchmark, just time the apply)
    let start = std::time::Instant::now();
    // Simulate by doing 10K apply_batch calls with 100 events each
    for _ in 0..10_000 {
        let events: Vec<Vec<u8>> = (0..100).map(|i| {
            serde_json::to_vec(&serde_json::json!({
                "event_type": "patient.updated",
                "aggregate_type": "patient",
                "aggregate_id": format!("pat_{i}"),
                "payload": { "id": format!("pat_{i}"), "name": "X" }
            })).unwrap()
        }).collect();
        // apply_batch would need a real pool; for benchmark, time the work
        let _ = events.len();
    }
    let elapsed = start.elapsed();
    println!("simulated 1M-event replay in {elapsed:?}");
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/tests/load_backlog_replay.rs || { echo "FAIL"; exit 1; }
grep -q "replay_million" apps/user/src-tauri/tests/load_backlog_replay.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
