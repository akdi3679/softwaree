# TASK ID: USER-004.1
# TITLE: Add User auto-reconnect logic
# STATUS: pending
# DEPENDENCIES: USER-003.5
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/auto_reconnect.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Background task that reconnects to the Admin when the connection drops.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/auto_reconnect.rs`:

```rust
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::error::AppResult;
use crate::state::AppState;
use crate::sync::client::{AdminEndpoint, SyncClient};

/// Last known admin endpoint (saved across restarts).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SavedEndpoint {
    pub host: String,
    pub port: u16,
    pub user_id: String,
    pub project_id: String,
    pub auth_token: String,
}

const RECONNECT_BACKOFF_SECS: [u64; 6] = [1, 2, 5, 10, 30, 60];

/// Start the auto-reconnect loop. Runs until the app exits.
pub fn spawn(state: Arc<AppState>, saved: Option<SavedEndpoint>) {
    tokio::spawn(async move {
        let mut attempt = 0u32;
        loop {
            let saved = match saved.clone() {
                Some(s) => s,
                None => {
                    sleep(Duration::from_secs(60)).await;
                    continue;
                }
            };
            let endpoint = AdminEndpoint {
                host: saved.host.clone(),
                port: saved.port,
            };
            match SyncClient::connect(
                &endpoint,
                &saved.user_id,
                &state.device.key,
                &saved.project_id,
                &saved.auth_token,
            ).await {
                Ok((client, _session)) => {
                    tracing::info!(host = %endpoint.host, "reconnected");
                    *state.sync.write().await = Some(client);
                    attempt = 0;
                    // Wait for the connection to die (client.drop signal)
                    sleep(Duration::from_secs(60)).await;
                }
                Err(e) => {
                    let idx = (attempt as usize).min(RECONNECT_BACKOFF_SECS.len() - 1);
                    let delay = RECONNECT_BACKOFF_SECS[idx];
                    tracing::warn!(error = %e, attempt, retry_in = delay, "reconnect failed");
                    sleep(Duration::from_secs(delay)).await;
                    attempt += 1;
                }
            }
        }
    });
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/auto_reconnect.rs || { echo "FAIL"; exit 1; }
grep -q "RECONNECT_BACKOFF" apps/user/src-tauri/src/sync/auto_reconnect.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
