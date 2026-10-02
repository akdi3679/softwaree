use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, parse};

#[derive(Debug, Deserialize)]
struct AdjustStock {
    product_id: String,
    delta: i32,
    reason: String,
}

pub fn handle_adjust_stock(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AdjustStock = parse(&cmd.payload)?;
    if req.delta == 0 {
        return Err(ModuleError::Validation("delta must be non-zero".into()));
    }
    let allowed = ["restock", "shrinkage", "damage", "count_correction"];
    if !allowed.contains(&req.reason.as_str()) {
        return Err(ModuleError::Validation(format!("invalid reason: {}", req.reason)));
    }
    let event = evt(
        "inventory.adjusted",
        "product",
        &req.product_id,
        2,
        json!({
            "product_id": req.product_id,
            "delta": req.delta,
            "reason": req.reason,
            "adjusted_at": chrono::Utc::now().to_rfc3339(),
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "product_id": req.product_id, "delta": req.delta }),
    })
}
