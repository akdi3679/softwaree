# TASK ID: ADMIN-028.1
# TITLE: Add Admin: per-event hot path: latency budget
# STATUS: pending
# DEPENDENCIES: USER-016.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/handlers/latency_hooks.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Wrap every command in a latency timer; warn if > 100ms.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/handlers/latency_hooks.rs`:

```rust
use std::time::Instant;
use tracing::warn;

pub struct LatencyGuard {
    start: Instant,
    command: String,
}

impl LatencyGuard {
    pub fn start(command: impl Into<String>) -> Self {
        Self { start: Instant::now(), command: command.into() }
    }
    pub fn finish(self) {
        let dur = self.start.elapsed();
        if dur.as_millis() > 100 {
            warn!(target: "perf", "command {} took {}ms", self.command, dur.as_millis());
        }
        tracing::trace!(target: "perf", "command {} in {}ms", self.command, dur.as_millis());
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/handlers/latency_hooks.rs || { echo "FAIL"; exit 1; }
grep -q "LatencyGuard" apps/admin/src-tauri/src/commands/handlers/latency_hooks.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
