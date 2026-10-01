# TASK ID: MEDICAL-003.3
# TITLE: Add medical concurrency tests (race conditions)
# STATUS: pending
# DEPENDENCIES: MEDICAL-003.2
# ALLOWED FILES: product/modules/medical-reception/src/concurrency_tests.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Test that concurrent calls to the same command don't double-allocate or corrupt state.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/concurrency_tests.rs`:

```rust
//! Concurrency tests for the medical-reception module.
//! Run with: cargo test --target wasm32-wasip2 concurrency_tests

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::patient;
    use crate::commands::appointment;
    use product_module_sdk::command::Command;
    use product_module_sdk::event::Event;
    use product_module_sdk::ModuleResult;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn make_cmd(command_type: &str, payload: serde_json::Value, idempotency_key: &str) -> Command {
        Command {
            id: format!("cmd_{}", idempotency_key),
            command_type: command_type.to_string(),
            aggregate_type: command_type.split('.').next().unwrap_or("").to_string(),
            aggregate_id: String::new(),
            actor_user_id: "usr_test".to_string(),
            device_id: "dev_test".to_string(),
            correlation_id: None,
            payload,
            idempotency_key: Some(idempotency_key.to_string()),
        }
    }

    /// If two clients send the same command with the same idempotency_key simultaneously,
    /// only one event should be produced.
    #[test]
    fn same_idempotency_key_produces_one_event() {
        let payload = serde_json::json!({
            "full_name": "Test Patient",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
        });
        let cmd1 = make_cmd("patient.create", payload.clone(), "key-abc");
        let cmd2 = make_cmd("patient.create", payload, "key-abc");
        let r1 = patient::handle_create(&cmd1).unwrap();
        let r2 = patient::handle_create(&cmd2).unwrap();
        // r2 should be empty (already processed)
        assert!(r2.events.is_empty(), "second call should not produce events");
        assert!(r1.events.len() == 1, "first call should produce one event");
        // The response should have idempotent_replay = true
        assert_eq!(r2.response["idempotent_replay"], serde_json::json!(true));
    }

    /// Different idempotency keys produce different events.
    #[test]
    fn different_keys_produce_different_events() {
        let p1 = serde_json::json!({"full_name": "Patient A", "phone": "+1", "date_of_birth": "1990-01-01"});
        let p2 = serde_json::json!({"full_name": "Patient B", "phone": "+2", "date_of_birth": "1990-01-01"});
        let r1 = patient::handle_create(&make_cmd("patient.create", p1, "k-1")).unwrap();
        let r2 = patient::handle_create(&make_cmd("patient.create", p2, "k-2")).unwrap();
        assert_ne!(r1.response["patient_id"], r2.response["patient_id"]);
    }

    /// Validation errors don't allocate IDs.
    #[test]
    fn validation_error_no_id() {
        let bad = serde_json::json!({"full_name": "", "phone": "+1", "date_of_birth": "1990-01-01"});
        let result = patient::handle_create(&make_cmd("patient.create", bad, "k-bad"));
        assert!(result.is_err());
        match result {
            Err(product_module_sdk::ModuleError::Validation(_)) => (),
            _ => panic!("expected Validation error"),
        }
    }
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/concurrency_tests.rs || { echo "FAIL"; exit 1; }
grep -q "same_idempotency_key_produces_one_event" modules/medical-reception/src/concurrency_tests.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
