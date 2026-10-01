# TASK ID: FOODLAB-003.1
# TITLE: Add food-lab idempotency + concurrency tests
# STATUS: pending
# DEPENDENCIES: MEDICAL-003.3
# ALLOWED FILES: product/modules/food-lab/src/idempotency.rs, product/modules/food-lab/src/concurrency_tests.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Same as MEDICAL-003 but for food-lab. Idempotency + race-condition tests.

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/idempotency.rs`:

```rust
use std::collections::HashSet;
use std::sync::RwLock;
use once_cell::sync::Lazy;

static CACHE: Lazy<RwLock<HashSet<String>>> = Lazy::new(|| RwLock::new(HashSet::new()));

pub fn check(command_type: &str, idempotency_key: &str) -> Option<String> {
    CACHE.read().ok()?.get(&format!("{command_type}::{idempotency_key}")).cloned()
}

pub fn record(command_type: &str, idempotency_key: &str, aggregate_id: &str) {
    if let Ok(mut cache) = CACHE.write() {
        cache.insert(format!("{command_type}::{idempotency_key}::{aggregate_id}"));
    }
}
```

Add `once_cell` to food-lab Cargo.toml:
```toml
once_cell = "1"
```

Update `product/modules/food-lab/src/commands/sample.rs`:

```rust
use crate::idempotency;

pub fn handle_intake(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let key = cmd.idempotency_key.as_deref().unwrap_or(&cmd.id);
    if let Some(prev_id) = idempotency::check("sample.intake", key) {
        return Ok(CommandOutcome {
            events: vec![],
            response: json!({ "sample_id": prev_id, "idempotent_replay": true }),
        });
    }
    // ... validation ...
    let sample_id = format!("smp_{}", Uuid::new_v4());
    let event = Event { /* ... */ };
    idempotency::record("sample.intake", key, &sample_id);
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": sample_id }) })
}
```

Create `product/modules/food-lab/src/concurrency_tests.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::sample;
    use product_module_sdk::command::Command;

    fn make_cmd(command_type: &str, payload: serde_json::Value, key: &str) -> Command {
        Command {
            id: format!("cmd_{key}"),
            command_type: command_type.to_string(),
            aggregate_type: "sample".to_string(),
            aggregate_id: String::new(),
            actor_user_id: "usr_test".into(),
            device_id: "dev_test".into(),
            correlation_id: None,
            payload,
            idempotency_key: Some(key.to_string()),
        }
    }

    #[test]
    fn intake_idempotent() {
        let p = serde_json::json!({"client_name": "Acme", "sample_type": "water", "collected_at": "2026-01-01"});
        let r1 = sample::handle_intake(&make_cmd("sample.intake", p.clone(), "k-1")).unwrap();
        let r2 = sample::handle_intake(&make_cmd("sample.intake", p, "k-1")).unwrap();
        assert_eq!(r1.events.len(), 1);
        assert_eq!(r2.events.len(), 0);
        assert_eq!(r2.response["idempotent_replay"], serde_json::json!(true));
    }

    #[test]
    fn missing_client_name() {
        let p = serde_json::json!({"sample_type": "water", "collected_at": "2026-01-01"});
        let r = sample::handle_intake(&make_cmd("sample.intake", p, "k-1"));
        assert!(r.is_err());
    }
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/idempotency.rs || { echo "FAIL"; exit 1; }
test -f modules/food-lab/src/concurrency_tests.rs || { echo "FAIL: no tests"; exit 1; }
grep -q "idempotency" modules/food-lab/src/commands/sample.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
