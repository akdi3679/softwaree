# TASK ID: MODULE-002.2
# TITLE: Add appointment commands to medical module
# STATUS: pending
# DEPENDENCIES: MODULE-002.1
# ALLOWED FILES: product/modules/medical-reception/src/commands/appointment.rs, product/modules/medical-reception/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add appointment.create, appointment.cancel, appointment.check_in commands.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/appointment.rs`:

```rust
use product_module_sdk::{event::Event, ModuleError, ModuleResult};
use product_module_sdk::command::{Command, CommandOutcome};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateAppointment {
    patient_id: String,
    scheduled_for: String, // ISO 8601
    duration_minutes: u32,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct CancelAppointment {
    appointment_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct CheckInAppointment {
    appointment_id: String,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateAppointment = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.patient_id.is_empty() {
        return Err(ModuleError::Validation("patient_id required".into()));
    }
    if req.duration_minutes == 0 {
        return Err(ModuleError::Validation("duration_minutes must be > 0".into()));
    }
    let appointment_id = format!("apt_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "appointment.created".into(),
        aggregate_type: "appointment".into(),
        aggregate_id: appointment_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "appointment_id": appointment_id,
            "patient_id": req.patient_id,
            "scheduled_for": req.scheduled_for,
            "duration_minutes": req.duration_minutes,
            "reason": req.reason,
            "status": "scheduled",
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "appointment_id": appointment_id }),
    })
}

pub fn handle_cancel(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CancelAppointment = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "appointment.cancelled".into(),
        aggregate_type: "appointment".into(),
        aggregate_id: req.appointment_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "appointment_id": req.appointment_id,
            "cancellation_reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "appointment_id": req.appointment_id, "status": "cancelled" }),
    })
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckInAppointment = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "appointment.checked_in".into(),
        aggregate_type: "appointment".into(),
        aggregate_id: req.appointment_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "appointment_id": req.appointment_id,
            "checked_in_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "appointment_id": req.appointment_id, "status": "checked_in" }),
    })
}
```

Update `product/modules/medical-reception/src/lib.rs`:

```rust
mod commands;

use product_module_sdk::{command::Command, event::Event, query::Query, ModuleError, ModuleResult};
use product_module_sdk::command::CommandOutcome;
use product_module_sdk::query::QueryOutcome;

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => commands::patient::handle_create(&cmd),
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

Create `product/modules/medical-reception/src/commands/patient.rs`:

```rust
use product_module_sdk::{event::Event, ModuleError, ModuleResult};
use product_module_sdk::command::{Command, CommandOutcome};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreatePatient {
    full_name: String,
    phone: String,
    date_of_birth: String,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreatePatient = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.full_name.is_empty() {
        return Err(ModuleError::Validation("full_name required".into()));
    }
    let patient_id = format!("pat_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "patient.created".into(),
        aggregate_type: "patient".into(),
        aggregate_id: patient_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "patient_id": patient_id,
            "full_name": req.full_name,
            "phone": req.phone,
            "date_of_birth": req.date_of_birth,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "patient_id": patient_id }),
    })
}
```

Update `lib.rs` to add `mod commands;` and the import.

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/appointment.rs || { echo "FAIL"; exit 1; }
test -f modules/medical-reception/src/commands/patient.rs || { echo "FAIL: no patient"; exit 1; }
grep -q "appointment.create" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
