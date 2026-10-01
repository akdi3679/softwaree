# TASK ID: MEDICAL-008.1
# TITLE: Add medical: chronic condition tracking
# STATUS: pending
# DEPENDENCIES: USER-012.2
# ALLOWED FILES: product/modules/medical-reception/src/commands/condition.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Track patient's chronic conditions (diabetes, hypertension, etc.).

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/condition.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct AddCondition {
    patient_id: String,
    condition_code: String,    // ICD-10 code, e.g. "E11.9" for type 2 diabetes
    condition_name: String,
    diagnosed_at: String,      // YYYY-MM-DD
    severity: String,          // "mild" | "moderate" | "severe"
    notes: Option<String>,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddCondition = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["mild", "moderate", "severe"].contains(&req.severity.as_str()) {
        return Err(ModuleError::Validation(format!("invalid severity: {}", req.severity)));
    }
    let id = format!("cond_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "condition.added".into(),
        aggregate_type: "condition".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "condition_id": id,
            "patient_id": req.patient_id,
            "condition_code": req.condition_code,
            "condition_name": req.condition_name,
            "diagnosed_at": req.diagnosed_at,
            "severity": req.severity,
            "notes": req.notes,
            "status": "active",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "condition_id": id }) })
}

#[derive(Debug, Deserialize)]
struct ResolveCondition {
    condition_id: String,
    resolved_at: String,
    notes: Option<String>,
}

pub fn handle_resolve(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ResolveCondition = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "condition.resolved".into(),
        aggregate_type: "condition".into(),
        aggregate_id: req.condition_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "condition_id": req.condition_id,
            "resolved_at": req.resolved_at,
            "notes": req.notes,
            "status": "resolved",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "condition_id": req.condition_id, "status": "resolved" }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/condition.rs || { echo "FAIL"; exit 1; }
grep -q "handle_add" modules/medical-reception/src/commands/condition.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
