pub mod commands;
pub mod helpers;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "menu_item.add" => commands::menu::handle_add(&cmd),
        "order.place" => commands::order::handle_place(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
