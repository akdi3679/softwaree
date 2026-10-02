pub mod commands;
pub mod helpers;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "room.add" => commands::room::handle_add(&cmd),
        "booking.create" => commands::booking::handle_create(&cmd),
        "booking.check_in" => commands::booking::handle_check_in(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
