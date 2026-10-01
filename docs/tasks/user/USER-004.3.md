# TASK ID: USER-004.3
# TITLE: Add User heartbeat (client side)
# STATUS: pending
# DEPENDENCIES: USER-004.2
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/heartbeat.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Background heartbeat that pings Admin every 30s. If it fails 3 times, triggers reconnect.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/heartbeat.rs`:

```rust
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::error::AppResult;
use crate::state::AppState;

const HEARTBEAT_INTERVAL_SECS: u64 = 30;
const MAX_MISSED: u32 = 3;

pub fn spawn(state: Arc<AppState>) {
    tokio::spawn(async move {
        let mut missed = 0u32;
        loop {
            sleep(Duration::from_secs(HEARTBEAT_INTERVAL_SECS)).await;
            let sync = state.sync.read().await;
            match sync.as_ref() {
                Some(client) => {
                    match client.heartbeat().await {
                        Ok(()) => {
                            missed = 0;
                            tracing::debug!("heartbeat ok");
                        }
                        Err(e) => {
                            missed += 1;
                            tracing::warn!(error = %e, missed, "heartbeat failed");
                        }
                    }
                }
                None => {
                    // Not connected — sleep more
                    sleep(Duration::from_secs(30)).await;
                    continue;
                }
            }
            if missed >= MAX_MISSED {
                tracing::warn!(missed, "too many missed heartbeats, will reconnect");
                *state.sync.write().await = None; // drop the dead client
                // The auto_reconnect task picks up from here
            }
        }
    });
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/heartbeat.rs || { echo "FAIL"; exit 1; }
grep -q "MAX_MISSED" apps/user/src-tauri/src/sync/heartbeat.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
