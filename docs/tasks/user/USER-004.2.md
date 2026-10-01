# TASK ID: USER-004.2
# TITLE: Add mDNS discovery (LAN-only)
# STATUS: pending
# DEPENDENCIES: USER-004.1
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/mdns.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Discover Admin devices on the LAN via mDNS with our mesh as fallback.

## REQUIRED IMPLEMENTATION

Add to Cargo.toml:
```toml
mdns-sd = "0.11"
```

Create `product/apps/user/src-tauri/src/sync/mdns.rs`:

```rust
use mdns_sd::{ServiceDaemon, ServiceEvent};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::sync::mpsc;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanAdmin {
    pub instance: String,
    pub host: String,
    pub port: u16,
}

/// Service name we look for.
const SERVICE_TYPE: &str = "_product-admin._tcp.local.";

/// Discover Admin instances on the LAN. Times out after `timeout_secs`.
pub async fn discover(timeout_secs: u64) -> AppResult<Vec<LanAdmin>> {
    let daemon = ServiceDaemon::new()
        .map_err(|e| AppError::Network(format!("mdns daemon: {e}")))?;
    let receiver = daemon
        .browse(SERVICE_TYPE)
        .map_err(|e| AppError::Network(format!("mdns browse: {e}")))?;

    let (tx, mut rx) = mpsc::channel::<LanAdmin>(32);
    let browse_task = tokio::task::spawn_blocking(move || {
        while let Ok(event) = receiver.recv() {
            match event {
                ServiceEvent::ServiceResolved(info) => {
                    let port = info.get_port();
                    let host = info.get_addresses().iter().next()
                        .map(|a| a.to_string())
                        .unwrap_or_default();
                    let instance = info.get_fullname().to_string();
                    let _ = tx.blocking_send(LanAdmin { instance, host, port });
                }
                _ => {}
            }
        }
    });

    let mut found: Vec<LanAdmin> = vec![];
    let deadline = tokio::time::Instant::now() + Duration::from_secs(timeout_secs);
    while tokio::time::Instant::now() < deadline {
        match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Some(admin)) => {
                if !found.iter().any(|f| f.instance == admin.instance) {
                    found.push(admin);
                }
            }
            _ => {}
        }
    }
    daemon.shutdown().ok();
    browse_task.abort();
    Ok(found)
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/mdns.rs || { echo "FAIL"; exit 1; }
grep -q "_product-admin" apps/user/src-tauri/src/sync/mdns.rs || { echo "FAIL"; exit 1; }
grep -q "mdns-sd" apps/user/src-tauri/Cargo.toml || { echo "FAIL: no mdns"; exit 1; }
echo "OK"
```
