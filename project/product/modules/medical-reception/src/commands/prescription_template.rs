use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateTemplate {
    name: String,
    diagnosis_code: Option<String>,
    items: Vec<TemplateItem>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize, serde::Serialize)]
struct TemplateItem {
    medication: String,
    dose: String,
    frequency: String,
    duration: String,
    instructions: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateTemplate = parse(&cmd.payload)?;
    if req.items.is_empty() {
        return Err(ModuleError::Validation("items required".into()));
    }
    let template_id = new_id("tmpl");
    let event = evt("prescription_template.created", "prescription_template", &template_id, 1, json!({
        "template_id": template_id,
        "name": req.name,
        "diagnosis_code": req.diagnosis_code,
        "items": req.items,
        "notes": req.notes,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "template_id": template_id }) })
}
