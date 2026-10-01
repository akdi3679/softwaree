# TASK ID: COMMUNICATION-001.2
# TITLE: Add mDNS service registration for Admin
# STATUS: pending
# DEPENDENCIES: COMMUNICATION-001.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/comm/mdns_register.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Admin registers an mDNS service so Users on the same LAN can find it.

## REQUIRED IMPLEMENTATION

Add to Cargo.toml:
```toml
mdns-sd = "0.11"
```

Create `product/apps/admin/src-tauri/src/comm/mod.rs`:

```rust
pub mod mdns_register;
```

Create `product/apps/admin/src-tauri/src/comm/mdns_register.rs`:

```rust
use mdns_sd::{ServiceDaemon, ServiceInfo};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

const SERVICE_TYPE: &str = "_product-admin._tcp.local.";
const SERVICE_PORT: u16 = 9420;

pub struct MdnsAdvertiser {
    daemon: ServiceDaemon,
    fullname: String,
}

impl MdnsAdvertiser {
    /// Register an Admin instance for mDNS discovery on the LAN.
    pub fn register(instance: &str, port: u16) -> std::io::Result<Self> {
        let daemon = ServiceDaemon::new()
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        let host_name = format!("{}.local.", hostname::get()?.to_string_lossy());
        let service = ServiceInfo::new(
            SERVICE_TYPE,
            instance,
            &host_name,
            "",
            port,
            None,
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        daemon.register(service)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(Self {
            daemon,
            fullname: service.get_fullname().to_string(),
        })
    }

    /// Browse for Admin instances. Returns a stream of `ServiceInfo`.
    pub fn browse(daemon: &ServiceDaemon) -> mdns_sd::Receiver<mdns_sd::ServiceEvent> {
        daemon.browse(SERVICE_TYPE).expect("mdns browse")
    }
}

impl Drop for MdnsAdvertiser {
    fn drop(&mut self) {
        let _ = self.daemon.unregister(&self.fullname);
        let _ = self.daemon.shutdown();
    }
}

/// Spawn a background task that periodically re-registers the mDNS service.
/// Workaround for stale entries if the device sleeps.
pub fn spawn_keep_alive(state: Arc<crate::state::AppState>) {
    tokio::spawn(async move {
        let advertiser = match MdnsAdvertiser::register("admin", SERVICE_PORT) {
            Ok(a) => a,
            Err(e) => {
                tracing::warn!(error = %e, "mDNS registration failed");
                return;
            }
        };
        // Hold the advertiser for the lifetime of the app
        let _hold = Arc::new(advertiser);
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
        }
    });
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/comm/mdns_register.rs || { echo "FAIL"; exit 1; }
grep -q "_product-admin" apps/admin/src-tauri/src/comm/mdns_register.rs || { echo "FAIL: no service"; exit 1; }
echo "OK"
```
