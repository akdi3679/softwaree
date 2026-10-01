# TASK ID: SYNC-002.1
# TITLE: Add sync reconnection storm handler (throttled reconnects)
# STATUS: pending
# DEPENDENCIES: WAREHOUSE-001.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/reconnect_throttle.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When the Admin comes back online, all Users reconnect at once — prevent thundering herd.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/reconnect_throttle.rs`:

```rust
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Semaphore;
use tokio::time::sleep;
use rand::Rng;

/// Limit concurrent connections on the Admin's sync server.
/// With N connected Users and a 5-minute reconnect window, the Admin shouldn't be
/// overwhelmed by all of them reconnecting at once.
pub struct ReconnectThrottle {
    /// Max concurrent new connections
    semaphore: Arc<Semaphore>,
    /// Per-User backoff
    pub per_user_backoff: Duration,
}

impl ReconnectThrottle {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            per_user_backoff: Duration::from_secs(2),
        }
    }

    /// Wait for permission to accept a new connection. Adds jitter to avoid thundering herd.
    pub async fn acquire(&self, user_id: &str) -> tokio::sync::OwnedSemaphorePermit {
        // Jitter: 0-5 seconds
        let jitter_ms = rand::thread_rng().gen_range(0..5000);
        sleep(Duration::from_millis(jitter_ms)).await;
        // Add a deterministic delay based on user_id hash
        let user_delay = (hash(user_id) % 1000) as u64;
        sleep(Duration::from_millis(user_delay)).await;
        self.semaphore.clone().acquire_owned().await.unwrap()
    }
}

fn hash(s: &str) -> u32 {
    let mut h: u32 = 0;
    for c in s.chars() { h = h.wrapping_mul(31).wrapping_add(c as u32); }
    h
}
```

Wire into the sync server's `accept_connection` function:

```rust
let _permit = state.reconnect_throttle.acquire(&user_id).await;
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/reconnect_throttle.rs || { echo "FAIL"; exit 1; }
grep -q "Semaphore" apps/admin/src-tauri/src/sync/reconnect_throttle.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
