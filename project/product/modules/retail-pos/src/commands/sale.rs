use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize, serde::Serialize)]
struct SaleItem { product_id: String, quantity: u32, unit_price_cents: u32 }

#[derive(Debug, Deserialize)]
struct RecordSale {
    items: Vec<SaleItem>,
    payment_method: String,
    customer_phone: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RefundSale { sale_id: String, reason: String }

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordSale = parse(&cmd.payload)?;
    if req.items.is_empty() { return Err(ModuleError::Validation("items required".into())); }
    if !["cash", "card", "transfer"].contains(&req.payment_method.as_str()) {
        return Err(ModuleError::Validation(format!("invalid payment_method: {}", req.payment_method)));
    }
    let total: u64 = req.items.iter().map(|i| i.unit_price_cents as u64 * i.quantity as u64).sum();
    let sale_id = new_id("sale");
    let event = evt("sale.recorded", "sale", &sale_id, 1, json!({
        "sale_id": sale_id, "items": req.items,
        "total_cents": total, "payment_method": req.payment_method,
        "customer_phone": req.customer_phone,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sale_id": sale_id, "total_cents": total }) })
}

pub fn handle_refund(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RefundSale = parse(&cmd.payload)?;
    let event = evt("sale.refunded", "sale", &req.sale_id, 2, json!({
        "sale_id": req.sale_id, "reason": req.reason, "status": "refunded",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sale_id": req.sale_id, "status": "refunded" }) })
}
