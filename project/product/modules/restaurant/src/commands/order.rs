use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize, serde::Serialize)]
struct OrderItem {
    item_id: String,
    quantity: u8,
    modifiers: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct PlaceOrder {
    table_number: u8,
    items: Vec<OrderItem>,
    notes: Option<String>,
}

pub fn handle_place(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: PlaceOrder = parse(&cmd.payload)?;
    if req.items.is_empty() {
        return Err(ModuleError::Validation("items required".into()));
    }
    let order_id = new_id("ord");
    let event = evt("order.placed", "order", &order_id, 1, json!({
        "order_id": order_id, "table_number": req.table_number,
        "items": req.items, "notes": req.notes,
        "status": "placed",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": order_id }) })
}
