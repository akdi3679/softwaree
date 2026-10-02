use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RecordPayment {
    member_id: String,
    amount_cents: u32,
    method: String,
    reference: Option<String>,
    paid_at: String,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordPayment = parse(&cmd.payload)?;
    if !["cash", "card", "transfer", "check"].contains(&req.method.as_str()) {
        return Err(ModuleError::Validation(format!("invalid method: {}", req.method)));
    }
    if req.amount_cents == 0 {
        return Err(ModuleError::Validation("amount must be > 0".into()));
    }
    let payment_id = new_id("pay");
    let event = evt(
        "payment.recorded",
        "payment",
        &payment_id,
        1,
        json!({
            "payment_id": payment_id,
            "member_id": req.member_id,
            "amount_cents": req.amount_cents,
            "method": req.method,
            "reference": req.reference,
            "paid_at": req.paid_at,
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "payment_id": payment_id }),
    })
}
