use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RenewMembership {
    member_id: String,
    new_plan: String,
    new_end_date: String,
    amount_cents: u32,
    paid_at: String,
}

pub fn handle_renew(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RenewMembership = parse(&cmd.payload)?;
    if !["monthly", "annual"].contains(&req.new_plan.as_str()) {
        return Err(ModuleError::Validation(format!("invalid new_plan: {}", req.new_plan)));
    }
    let renewal_id = new_id("ren");
    let event = evt(
        "membership.renewed",
        "membership",
        &req.member_id,
        2,
        json!({
            "renewal_id": renewal_id,
            "member_id": req.member_id,
            "new_plan": req.new_plan,
            "new_end_date": req.new_end_date,
            "amount_cents": req.amount_cents,
            "paid_at": req.paid_at,
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "renewal_id": renewal_id }),
    })
}
