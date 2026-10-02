pub mod commands;
pub mod helpers;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "subscription.create" => commands::subscription::handle_create(&cmd),
        "invoice.issue" => commands::invoice::handle_issue(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
