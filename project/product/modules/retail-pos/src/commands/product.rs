use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateProduct {
    sku: String,
    name: String,
    price_cents: u32,
    stock: u32,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateProduct = parse(&cmd.payload)?;
    if req.sku.trim().is_empty() { return Err(ModuleError::Validation("sku required".into())); }
    if req.price_cents == 0 { return Err(ModuleError::Validation("price must be > 0".into())); }
    let product_id = new_id("prod");
    let event = evt("product.created", "product", &product_id, 1, json!({
        "product_id": product_id, "sku": req.sku, "name": req.name,
        "price_cents": req.price_cents, "stock": req.stock,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "product_id": product_id }) })
}
