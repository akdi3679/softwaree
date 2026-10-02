use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RegisterClient {
    name: String,
    company_type: String,
    contact_name: String,
    contact_email: String,
    contact_phone: String,
    address: String,
    license_number: Option<String>,
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterClient = parse(&cmd.payload)?;
    let valid = ["manufacturer", "importer", "retailer", "restaurant", "other"];
    if !valid.contains(&req.company_type.as_str()) {
        return Err(ModuleError::Validation(format!("invalid company_type: {}", req.company_type)));
    }
    let client_id = new_id("cli");
    let event = evt("client.registered", "client", &client_id, 1, json!({
        "client_id": client_id,
        "name": req.name,
        "company_type": req.company_type,
        "contact_name": req.contact_name,
        "contact_email": req.contact_email,
        "contact_phone": req.contact_phone,
        "address": req.address,
        "license_number": req.license_number,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "client_id": client_id }) })
}
