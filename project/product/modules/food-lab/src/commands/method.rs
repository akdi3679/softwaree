use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RegisterMethod {
    code: String,
    name: String,
    description: String,
    category: String,
    standard_org: String,
    estimated_minutes: u16,
    requires_equipment: Vec<String>,
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterMethod = parse(&cmd.payload)?;
    let valid = ["composition", "microbiological", "chemistry", "physics", "sensory"];
    if !valid.contains(&req.category.as_str()) {
        return Err(ModuleError::Validation(format!("invalid category: {}", req.category)));
    }
    let method_id = new_id("meth");
    let event = evt("method.registered", "method", &method_id, 1, json!({
        "method_id": method_id,
        "code": req.code,
        "name": req.name,
        "description": req.description,
        "category": req.category,
        "standard_org": req.standard_org,
        "estimated_minutes": req.estimated_minutes,
        "requires_equipment": req.requires_equipment,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "method_id": method_id }) })
}
