# TASK ID: ADMIN-005.6
# TITLE: Add outbox dispatcher
# STATUS: pending
# DEPENDENCIES: ADMIN-005.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/events/dispatcher.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the outbox dispatcher — reads pending events and delivers them to connected Users via the sync engine.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/src/events/mod.rs`:

```rust
pub mod store;
pub mod dispatcher;
```

Create `product/apps/admin/src-tauri/src/events/dispatcher.rs`:

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use sqlx::SqlitePool;
use serde_json::Value;

use crate::error::AppResult;
use crate::events::store;

/// Per-user delivery target (a connected user device).
#[derive(Clone)]
pub struct DeliveryTarget {
    pub user_id: String,
    pub device_id: String,
    pub sink: Arc<dyn EventSink>,
}

#[async_trait::async_trait]
pub trait EventSink: Send + Sync {
    async fn send(&self, event_json: Value) -> Result<(), String>;
}

/// The dispatcher's state. Held by the AppState.
pub struct DispatcherState {
    /// Active delivery targets, keyed by user_id+device_id
    pub targets: HashMap<String, DeliveryTarget>,
}

impl Default for DispatcherState {
    fn default() -> Self {
        Self { targets: HashMap::new() }
    }
}

/// Add a delivery target (called when a User connects via sync).
pub fn register_target(state: &Arc<RwLock<DispatcherState>>, target: DeliveryTarget) {
    let key = format!("{}:{}", target.user_id, target.device_id);
    let mut s = state.blocking_write();
    s.targets.insert(key, target);
}

/// Remove a delivery target (called when a User disconnects).
pub fn unregister_target(state: &Arc<RwLock<DispatcherState>>, user_id: &str, device_id: &str) {
    let key = format!("{}:{}", user_id, device_id);
    let mut s = state.blocking_write();
    s.targets.remove(&key);
}

/// Dispatch all pending events to all registered targets.
/// Returns the number of events dispatched.
pub async fn dispatch_pending(
    pool: &SqlitePool,
    state: &Arc<RwLock<DispatcherState>>,
) -> AppResult<u64> {
    let pending = store::read_since(pool, 0, 1000).await?;
    let mut count = 0u64;

    // Snapshot targets to avoid holding the lock during network IO
    let targets: Vec<DeliveryTarget> = {
        let s = state.read().await;
        s.targets.values().cloned().collect()
    };

    for event in &pending {
        let event_json = serde_json::to_value(event)?;
        for target in &targets {
            // TODO: filter by authorization (which user can see which event)
            // For now, deliver to all
            if let Err(e) = target.sink.send(event_json.clone()).await {
                tracing::warn!(error = %e, user_id = %target.user_id, "delivery failed");
            } else {
                count += 1;
            }
        }
        // Mark event delivery records (simplified)
        // Real impl: insert into event_deliveries with per-user state
    }
    Ok(count)
}
```

Add to Cargo.toml:
```toml
async-trait = "0.1"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/events/dispatcher.rs || { echo "FAIL"; exit 1; }
grep -q "EventSink" apps/admin/src-tauri/src/events/dispatcher.rs || { echo "FAIL"; exit 1; }
grep -q "async-trait" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no async-trait"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
