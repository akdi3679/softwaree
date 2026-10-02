pub mod commands;
pub mod helpers;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "student.enroll" => commands::student::handle_enroll(&cmd),
        "attendance.record" => commands::attendance::handle_record(&cmd),
        "grade.enter" => commands::grade::handle_enter(&cmd),
        "report_card.generate" => commands::report_card::handle_generate(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
