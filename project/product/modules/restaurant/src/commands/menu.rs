use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct AddMenuItem {
    name: String,
    category: String,
    price_cents: u32,
    description: Option<String>,
    available: bool,
    prep_minutes: u8,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddMenuItem = parse(&cmd.payload)?;
    if !["appetizer", "main", "dessert", "drink"].contains(&req.category.as_str()) {
        return Err(ModuleError::Validation(format!("invalid category: {}", req.category)));
    }
    let item_id = new_id("item");
    let event = evt("menu_item.added", "menu_item", &item_id, 1, json!({
        "item_id": item_id, "name": req.name, "category": req.category,
        "price_cents": req.price_cents, "description": req.description,
        "available": req.available, "prep_minutes": req.prep_minutes,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "item_id": item_id }) })
}
