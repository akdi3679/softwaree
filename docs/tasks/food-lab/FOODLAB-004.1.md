# TASK ID: FOODLAB-004.1
# TITLE: Add food-lab chain of custody (CoC)
# STATUS: pending
# DEPENDENCIES: MEDICAL-004.5
# ALLOWED FILES: product/modules/food-lab/src/commands/custody.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Track who handled a sample, when, and where. Required for legal defensibility of test results.

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/commands/custody.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct TransferCustody {
    sample_id: String,
    from_user: String,
    to_user: String,
    location: String,
    reason: String,  // "test_handoff" | "storage" | "disposal" | "other"
    temperature_c: Option<f64>,
    notes: Option<String>,
}

pub fn handle_transfer(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: TransferCustody = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["test_handoff", "storage", "disposal", "other"].contains(&req.reason.as_str()) {
        return Err(ModuleError::Validation(format!("invalid reason: {}", req.reason)));
    }
    if req.from_user == req.to_user {
        return Err(ModuleError::Validation("from and to must differ".into()));
    }
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.custody_transferred".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 100, // bump version
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "from_user": req.from_user,
            "to_user": req.to_user,
            "location": req.location,
            "reason": req.reason,
            "temperature_c": req.temperature_c,
            "notes": req.notes,
            "transferred_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sample_id": req.sample_id, "transferred_to": req.to_user }),
    })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/commands/custody.rs || { echo "FAIL"; exit 1; }
grep -q "handle_transfer" modules/food-lab/src/commands/custody.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
