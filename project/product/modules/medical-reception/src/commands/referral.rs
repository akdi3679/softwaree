use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateReferral {
    patient_id: String,
    visit_id: Option<String>,
    specialist: String,
    specialist_name: Option<String>,
    reason: String,
    urgency: String,
    notes: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateReferral = parse(&cmd.payload)?;
    if !["cardiology", "dermatology", "orthopedics", "neurology", "other"].contains(&req.specialist.as_str()) {
        return Err(ModuleError::Validation(format!("invalid specialist: {}", req.specialist)));
    }
    if !["routine", "urgent", "emergency"].contains(&req.urgency.as_str()) {
        return Err(ModuleError::Validation(format!("invalid urgency: {}", req.urgency)));
    }
    let referral_id = new_id("ref");
    let event = evt("referral.created", "referral", &referral_id, 1, json!({
        "referral_id": referral_id,
        "patient_id": req.patient_id,
        "visit_id": req.visit_id,
        "specialist": req.specialist,
        "specialist_name": req.specialist_name,
        "reason": req.reason,
        "urgency": req.urgency,
        "notes": req.notes,
        "status": "pending",
        "created_at": chrono::Utc::now().to_rfc3339(),
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "referral_id": referral_id }) })
}
