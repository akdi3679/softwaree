# TASK ID: MEDICAL-001.2
# TITLE: Add visit commands (consultation record)
# STATUS: pending
# DEPENDENCIES: MEDICAL-001.1
# ALLOWED FILES: product/modules/medical-reception/src/commands/visit.rs, product/modules/medical-reception/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add visit commands: visit.start, visit.add_note, visit.complete, visit.prescribe.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/visit.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleError;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct StartVisit {
    appointment_id: String,
    patient_id: String,
    chief_complaint: String,
}

#[derive(Debug, Deserialize)]
struct AddVisitNote {
    visit_id: String,
    note: String,
    note_type: String, // "subjective" | "objective" | "assessment" | "plan"
}

#[derive(Debug, Deserialize)]
struct CompleteVisit {
    visit_id: String,
    diagnosis: String,
    summary: String,
}

#[derive(Debug, Deserialize)]
struct Prescribe {
    visit_id: String,
    medication: String,
    dosage: String,
    frequency: String,
    duration_days: u32,
}

pub fn handle_start(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: StartVisit = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let visit_id = format!("vis_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "visit.started".into(),
        aggregate_type: "visit".into(),
        aggregate_id: visit_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "visit_id": visit_id,
            "appointment_id": req.appointment_id,
            "patient_id": req.patient_id,
            "chief_complaint": req.chief_complaint,
            "started_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "visit_id": visit_id }),
    })
}

pub fn handle_add_note(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddVisitNote = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["subjective", "objective", "assessment", "plan"].contains(&req.note_type.as_str()) {
        return Err(ModuleError::Validation(format!("invalid note_type: {}", req.note_type)));
    }
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "visit.note_added".into(),
        aggregate_type: "visit".into(),
        aggregate_id: req.visit_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "visit_id": req.visit_id,
            "note": req.note,
            "note_type": req.note_type,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "visit_id": req.visit_id }),
    })
}

pub fn handle_complete(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CompleteVisit = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "visit.completed".into(),
        aggregate_type: "visit".into(),
        aggregate_id: req.visit_id.clone(),
        version: 3,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "visit_id": req.visit_id,
            "diagnosis": req.diagnosis,
            "summary": req.summary,
            "completed_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "visit_id": req.visit_id, "status": "completed" }),
    })
}

pub fn handle_prescribe(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: Prescribe = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let prescription_id = format!("rx_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "visit.prescribed".into(),
        aggregate_type: "visit".into(),
        aggregate_id: req.visit_id.clone(),
        version: 4,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "visit_id": req.visit_id,
            "prescription_id": prescription_id,
            "medication": req.medication,
            "dosage": req.dosage,
            "frequency": req.frequency,
            "duration_days": req.duration_days,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "prescription_id": prescription_id }),
    })
}
```

Update `product/modules/medical-reception/src/lib.rs`:

```rust
mod commands;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => commands::patient::handle_create(&cmd),
        "patient.update" => commands::patient::handle_update(&cmd),
        "patient.archive" => commands::patient::handle_archive(&cmd),
        "appointment.create" => commands::appointment::handle_create(&cmd),
        "appointment.cancel" => commands::appointment::handle_cancel(&cmd),
        "appointment.check_in" => commands::appointment::handle_check_in(&cmd),
        "visit.start" => commands::visit::handle_start(&cmd),
        "visit.add_note" => commands::visit::handle_add_note(&cmd),
        "visit.complete" => commands::visit::handle_complete(&cmd),
        "visit.prescribe" => commands::visit::handle_prescribe(&cmd),
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
test -f modules/medical-reception/src/commands/visit.rs || { echo "FAIL"; exit 1; }
grep -q "visit.start" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
