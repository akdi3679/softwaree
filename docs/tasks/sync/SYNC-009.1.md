# TASK ID: SYNC-009.1
# TITLE: Add sync: idle disconnect (save battery on phones)
# STATUS: pending
# DEPENDENCIES: ADMIN-047.2
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/idle.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
After 5 min of inactivity, drop the WebSocket. Reconnect on activity.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/idle.rs`:

```rust
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::Instant;
use crate::sync::ws::WsClient;

pub struct IdleWatcher {
    last_activity: Arc<Mutex<Instant>>,
    timeout: Duration,
}

impl IdleWatcher {
    pub fn new(timeout_secs: u64) -> Self {
        Self {
            last_activity: Arc::new(Mutex::new(Instant::now())),
            timeout: Duration::from_secs(timeout_secs),
        }
    }
    pub async fn touch(&self) {
        *self.last_activity.lock().await = Instant::now();
    }
    pub fn spawn(self: Arc<Self>, client: Arc<WsClient>) {
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(30)).await;
                let last = *self.last_activity.lock().await;
                if last.elapsed() > self.timeout {
                    tracing::info!(target: "sync", "idle for {:?}, disconnecting", last.elapsed());
                    client.disconnect().await;
                } else {
                    // Activity — make sure we're connected
                    if !client.is_connected().await {
                        client.connect().await;
                    }
                }
            }
        });
    }
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/idle.rs || { echo "FAIL"; exit 1; }
grep -q "IdleWatcher" apps/user/src-tauri/src/sync/idle.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
