use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct AddCondition {
    patient_id: String,
    condition_code: String,
    condition_name: String,
    diagnosed_at: String,
    severity: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ResolveCondition {
    condition_id: String,
    resolved_at: String,
    notes: Option<String>,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddCondition = parse(&cmd.payload)?;
    if !["mild", "moderate", "severe"].contains(&req.severity.as_str()) {
        return Err(ModuleError::Validation(format!("invalid severity: {}", req.severity)));
    }
    let condition_id = new_id("cond");
    let event = evt("condition.added", "condition", &condition_id, 1, json!({
        "condition_id": condition_id,
        "patient_id": req.patient_id,
        "condition_code": req.condition_code,
        "condition_name": req.condition_name,
        "diagnosed_at": req.diagnosed_at,
        "severity": req.severity,
        "notes": req.notes,
        "status": "active",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "condition_id": condition_id }) })
}

pub fn handle_resolve(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ResolveCondition = parse(&cmd.payload)?;
    let event = evt("condition.resolved", "condition", &req.condition_id, 2, json!({
        "condition_id": req.condition_id,
        "resolved_at": req.resolved_at,
        "notes": req.notes,
        "status": "resolved",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "condition_id": req.condition_id, "status": "resolved" }) })
}
