use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, parse};

#[derive(Debug, Deserialize)]
struct TransferCustody {
    sample_id: String,
    from_user: String,
    to_user: String,
    location: String,
    reason: String,
    temperature_c: Option<f64>,
    notes: Option<String>,
}

pub fn handle_transfer(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: TransferCustody = parse(&cmd.payload)?;
    if !["test_handoff", "storage", "disposal", "other"].contains(&req.reason.as_str()) {
        return Err(ModuleError::Validation(format!("invalid reason: {}", req.reason)));
    }
    if req.from_user == req.to_user {
        return Err(ModuleError::Validation("from_user and to_user must differ".into()));
    }
    let event = evt("sample.custody_transferred", "sample", &req.sample_id, 100, json!({
        "sample_id": req.sample_id,
        "from_user": req.from_user,
        "to_user": req.to_user,
        "location": req.location,
        "reason": req.reason,
        "temperature_c": req.temperature_c,
        "notes": req.notes,
        "transferred_at": chrono::Utc::now().to_rfc3339(),
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": req.sample_id, "transferred_to": req.to_user }) })
}
