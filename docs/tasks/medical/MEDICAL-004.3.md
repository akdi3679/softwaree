# TASK ID: MEDICAL-004.3
# TITLE: Add medical waiting list (queue when no slot available)
# STATUS: pending
# DEPENDENCIES: MEDICAL-004.2
# ALLOWED FILES: product/modules/medical-reception/src/commands/waiting_list.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When no appointment slots are available, add patient to waiting list.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/waiting_list.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct AddToWaitingList {
    patient_id: String,
    requested_date: String,         // YYYY-MM-DD
    priority: Option<String>,       // "low" | "normal" | "high" | "urgent"
    reason: String,
    contact_when_available: bool,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddToWaitingList = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let priority = req.priority.unwrap_or_else(|| "normal".to_string());
    if !["low", "normal", "high", "urgent"].contains(&priority.as_str()) {
        return Err(ModuleError::Validation(format!("invalid priority: {priority}")));
    }
    let entry_id = format!("wl_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "waiting_list.added".into(),
        aggregate_type: "waiting_list_entry".into(),
        aggregate_id: entry_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "entry_id": entry_id,
            "patient_id": req.patient_id,
            "requested_date": req.requested_date,
            "priority": priority,
            "reason": req.reason,
            "contact_when_available": req.contact_when_available,
            "status": "waiting",
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "entry_id": entry_id }),
    })
}

#[derive(Debug, Deserialize)]
struct RemoveFromWaitingList {
    entry_id: String,
    reason: String,
}

pub fn handle_remove(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RemoveFromWaitingList = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "waiting_list.removed".into(),
        aggregate_type: "waiting_list_entry".into(),
        aggregate_id: req.entry_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "entry_id": req.entry_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "entry_id": req.entry_id, "status": "removed" }),
    })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/waiting_list.rs || { echo "FAIL"; exit 1; }
grep -q "handle_add" modules/medical-reception/src/commands/waiting_list.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
