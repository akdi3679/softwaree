use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct AddToWaitingList {
    patient_id: String,
    requested_date: String,
    priority: Option<String>,
    reason: String,
    contact_when_available: bool,
}

#[derive(Debug, Deserialize)]
struct RemoveFromWaitingList {
    entry_id: String,
    reason: String,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddToWaitingList = parse(&cmd.payload)?;
    let priority = req.priority.unwrap_or_else(|| "normal".to_string());
    if !["low", "normal", "high", "urgent"].contains(&priority.as_str()) {
        return Err(ModuleError::Validation(format!("invalid priority: {priority}")));
    }
    let entry_id = new_id("wl");
    let event = evt("waiting_list.added", "waiting_list_entry", &entry_id, 1, json!({
        "entry_id": entry_id,
        "patient_id": req.patient_id,
        "requested_date": req.requested_date,
        "priority": priority,
        "reason": req.reason,
        "contact_when_available": req.contact_when_available,
        "status": "waiting",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "entry_id": entry_id }) })
}

pub fn handle_remove(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RemoveFromWaitingList = parse(&cmd.payload)?;
    let event = evt("waiting_list.removed", "waiting_list_entry", &req.entry_id, 2, json!({
        "entry_id": req.entry_id,
        "reason": req.reason,
        "status": "removed",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "entry_id": req.entry_id, "status": "removed" }) })
}
