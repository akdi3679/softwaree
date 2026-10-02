use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize, serde::Serialize)]
struct ReturnItem {
    product_id: String,
    quantity: u32,
}

#[derive(Debug, Deserialize)]
struct ProcessReturn {
    original_sale_id: String,
    items: Vec<ReturnItem>,
    reason: String,
    refund_method: String,
}

pub fn handle_process(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ProcessReturn = parse(&cmd.payload)?;
    if req.items.is_empty() {
        return Err(ModuleError::Validation("items required".into()));
    }
    let allowed = ["cash", "card", "store_credit"];
    if !allowed.contains(&req.refund_method.as_str()) {
        return Err(ModuleError::Validation(format!("invalid refund_method: {}", req.refund_method)));
    }
    let return_id = new_id("ret");
    let event = evt(
        "sale.returned",
        "sale",
        &req.original_sale_id,
        3,
        json!({
            "return_id": return_id,
            "original_sale_id": req.original_sale_id,
            "items": req.items,
            "reason": req.reason,
            "refund_method": req.refund_method,
            "returned_at": chrono::Utc::now().to_rfc3339(),
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "return_id": return_id }),
    })
}
