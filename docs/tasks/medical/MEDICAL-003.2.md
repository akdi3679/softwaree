# TASK ID: MEDICAL-003.2
# TITLE: Add medical idempotency keys for safe retries
# STATUS: pending
# DEPENDENCIES: MEDICAL-003.1
# ALLOWED FILES: product/modules/medical-reception/src/idempotency.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Support idempotency keys — the same command sent twice produces one event, not two.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/idempotency.rs`:

```rust
use std::collections::HashSet;
use std::sync::RwLock;
use once_cell::sync::Lazy;

/// In-memory idempotency cache. In production, this is in SQLite.
/// Keyed by (command_type, idempotency_key) → aggregate_id of the produced event.
static CACHE: Lazy<RwLock<HashSet<String>>> = Lazy::new(|| RwLock::new(HashSet::new()));

/// Check if we've already processed this command. Returns Some(aggregate_id) if so.
pub fn check(command_type: &str, idempotency_key: &str) -> Option<String> {
    let key = format!("{command_type}::{idempotency_key}");
    CACHE.read().ok()?.get(&key).cloned()
}

/// Record a successful processing.
pub fn record(command_type: &str, idempotency_key: &str, aggregate_id: &str) {
    if let Ok(mut cache) = CACHE.write() {
        cache.insert(format!("{command_type}::{idempotency_key}::{aggregate_id}"));
    }
}

/// Build the cache key.
pub fn make_key(command_type: &str, idempotency_key: &str) -> String {
    format!("{command_type}::{idempotency_key}")
}
```

Add `once_cell` to the medical-reception Cargo.toml:
```toml
once_cell = "1"
```

Update `product/modules/medical-reception/src/commands/patient.rs`:

```rust
use crate::idempotency;
use product_module_sdk::command::Command;

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    // ... validation ...

    // Idempotency check
    let key = cmd.idempotency_key.as_deref().unwrap_or(&cmd.id);
    if let Some(prev_id) = idempotency::check("patient.create", key) {
        return Ok(CommandOutcome {
            events: vec![],
            response: serde_json::json!({ "patient_id": prev_id, "idempotent_replay": true }),
        });
    }

    // ... do the work, produce event ...

    let event = Event { /* ... */ aggregate_id: patient_id.clone(), /* ... */ };
    idempotency::record("patient.create", key, &patient_id);
    Ok(CommandOutcome { events: vec![event], response: serde_json::json!({ "patient_id": patient_id }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/idempotency.rs || { echo "FAIL"; exit 1; }
grep -q "idempotency::check" modules/medical-reception/src/commands/patient.rs || { echo "FAIL"; exit 1; }
grep -q "once_cell" modules/medical-reception/Cargo.toml || { echo "FAIL: no once_cell"; exit 1; }
echo "OK"
```
