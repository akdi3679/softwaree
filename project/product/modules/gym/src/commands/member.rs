use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateMember {
    full_name: String,
    email: String,
    phone: String,
    membership_type: String,
}

#[derive(Debug, Deserialize)]
struct CheckIn { member_id: String }

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateMember = parse(&cmd.payload)?;
    if !["monthly", "annual", "day_pass"].contains(&req.membership_type.as_str()) {
        return Err(ModuleError::Validation(format!("invalid membership_type: {}", req.membership_type)));
    }
    let member_id = new_id("mem");
    let event = evt("member.created", "member", &member_id, 1, json!({
        "member_id": member_id, "full_name": req.full_name, "email": req.email,
        "phone": req.phone, "membership_type": req.membership_type,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "member_id": member_id }) })
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckIn = parse(&cmd.payload)?;
    let event = evt("member.checked_in", "member", &req.member_id, 2, json!({
        "member_id": req.member_id,
        "checked_in_at": chrono::Utc::now().to_rfc3339(),
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "member_id": req.member_id, "status": "checked_in" }) })
}
