# TASK ID: SYNC-006.1
# TITLE: Add sync: heartbeat with cursor (avoid idle)
# STATUS: pending
# DEPENDENCIES: USER-014.2
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/heartbeat.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
While connected, send heartbeat every 30s with last known cursor. Admin uses this to detect slow consumers.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/heartbeat.rs`:

```rust
use std::time::Duration;
use tokio::time::interval;
use crate::state::AppState;
use crate::sync::ws::WsClient;
use serde::Serialize;

#[derive(Serialize)]
struct Heartbeat {
    cursor: i64,
    user_agent: String,
    session_id: String,
}

pub fn spawn(state: std::sync::Arc<AppState>, client: std::sync::Arc<WsClient>) {
    tokio::spawn(async move {
        let mut tick = interval(Duration::from_secs(30));
        loop {
            tick.tick().await;
            let h = Heartbeat {
                cursor: state.last_sequence.load(std::sync::atomic::Ordering::Relaxed),
                user_agent: format!("product-user/{}", env!("CARGO_PKG_VERSION")),
                session_id: state.session_id.clone(),
            };
            if let Err(e) = client.send(serde_json::to_string(&h).unwrap()).await {
                tracing::error!("heartbeat failed: {e}");
            }
        }
    });
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/heartbeat.rs || { echo "FAIL"; exit 1; }
grep -q "heartbeat" apps/user/src-tauri/src/sync/heartbeat.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
