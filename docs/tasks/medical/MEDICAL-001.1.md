# TASK ID: MEDICAL-001.1
# TITLE: Add patient commands to medical-reception module
# STATUS: pending
# DEPENDENCIES: MODULE-002.5
# ALLOWED FILES: product/modules/medical-reception/src/commands/patient.rs, product/modules/medical-reception/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add full patient commands: create, update, archive, search.

## REQUIRED IMPLEMENTATION

Append to `product/modules/medical-reception/src/commands/patient.rs`:

```rust
#[derive(Debug, Deserialize)]
struct UpdatePatient {
    patient_id: String,
    full_name: Option<String>,
    phone: Option<String>,
    date_of_birth: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ArchivePatient {
    patient_id: String,
    reason: String,
}

pub fn handle_update(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: UpdatePatient = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "patient.updated".into(),
        aggregate_type: "patient".into(),
        aggregate_id: req.patient_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: serde_json::json!({
            "patient_id": req.patient_id,
            "full_name": req.full_name,
            "phone": req.phone,
            "date_of_birth": req.date_of_birth,
            "notes": req.notes,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: serde_json::json!({ "patient_id": req.patient_id }),
    })
}

pub fn handle_archive(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ArchivePatient = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "patient.archived".into(),
        aggregate_type: "patient".into(),
        aggregate_id: req.patient_id.clone(),
        version: 3,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: serde_json::json!({
            "patient_id": req.patient_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: serde_json::json!({ "patient_id": req.patient_id, "status": "archived" }),
    })
}
```

Update `product/modules/medical-reception/src/lib.rs`:

```rust
mod commands;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleError;
use product_module_sdk::ModuleResult;

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => commands::patient::handle_create(&cmd),
        "patient.update" => commands::patient::handle_update(&cmd),
        "patient.archive" => commands::patient::handle_archive(&cmd),
        "appointment.create" => commands::appointment::handle_create(&cmd),
        "appointment.cancel" => commands::appointment::handle_cancel(&cmd),
        "appointment.check_in" => commands::appointment::handle_check_in(&cmd),
        _ => Err(ModuleError::Validation(format!("unknown command: {}", cmd.command_type))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome {
        response: serde_json::json!({ "status": "ok" }),
    })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/patient.rs || { echo "FAIL"; exit 1; }
grep -q "patient.update" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
