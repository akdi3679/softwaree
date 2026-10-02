pub mod commands;
pub mod helpers;
pub mod queries;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "product.create" => commands::product::handle_create(&cmd),
        "sale.record" => commands::sale::handle_record(&cmd),
        "sale.refund" => commands::sale::handle_refund(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    match q.query_type.as_str() {
        "product.list" => queries::product::handle_list(&q),
        "sale.today" => queries::sale::handle_today(&q),
        other => Err(ModuleError::Validation(format!("unknown query: {other}"))),
    }
}
