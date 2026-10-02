pub mod commands;
pub mod helpers;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "member.create" => commands::member::handle_create(&cmd),
        "member.check_in" => commands::member::handle_check_in(&cmd),
        "class.book" => commands::class::handle_book(&cmd),
        "membership.renew" => commands::renewal::handle_renew(&cmd),
        "payment.record" => commands::payment::handle_record(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
