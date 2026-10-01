# TASK ID: MEDICAL-005.1
# TITLE: Add medical referral (refer to specialist)
# STATUS: pending
# DEPENDENCIES: MODULE-004.4
# ALLOWED FILES: product/modules/medical-reception/src/commands/referral.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Doctor refers patient to a specialist.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/referral.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateReferral {
    patient_id: String,
    visit_id: Option<String>,
    specialist: String,        // "cardiology" | "dermatology" | "orthopedics" | "neurology" | "other"
    specialist_name: Option<String>,
    reason: String,
    urgency: String,          // "routine" | "urgent" | "emergency"
    notes: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateReferral = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["cardiology", "dermatology", "orthopedics", "neurology", "other"].contains(&req.specialist.as_str()) {
        return Err(ModuleError::Validation(format!("invalid specialist: {}", req.specialist)));
    }
    if !["routine", "urgent", "emergency"].contains(&req.urgency.as_str()) {
        return Err(ModuleError::Validation(format!("invalid urgency: {}", req.urgency)));
    }
    let id = format!("ref_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "referral.created".into(),
        aggregate_type: "referral".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "referral_id": id,
            "patient_id": req.patient_id,
            "visit_id": req.visit_id,
            "specialist": req.specialist,
            "specialist_name": req.specialist_name,
            "reason": req.reason,
            "urgency": req.urgency,
            "notes": req.notes,
            "status": "pending",
            "created_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "referral_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/referral.rs || { echo "FAIL"; exit 1; }
grep -q "handle_create" modules/medical-reception/src/commands/referral.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
