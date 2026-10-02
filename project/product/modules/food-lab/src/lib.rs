//! food-lab module — source-only for Session 13.
//!
//! Every handler returns events; the host (Admin) is responsible for
//! transactions, authorization, audit, and outbox. Wasmtime wiring is
//! deferred (see SESSION_MEMORY Open Deferred Items).

pub mod commands;
pub mod helpers;
pub mod idempotency;
pub mod reports;
pub mod queries;

#[cfg(test)]
pub mod concurrency_tests;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "sample.intake" => commands::sample::handle_intake(&cmd),
        "sample.start_test" => commands::sample::handle_start_test(&cmd),
        "sample.record_result" => commands::sample::handle_record_result(&cmd),
        "sample.issue_report" => commands::sample::handle_issue_report(&cmd),
        "sample.retest" => commands::sample::handle_retest(&cmd),
        "sample.reject" => commands::sample::handle_reject(&cmd),
        "sample.archive" => commands::sample::handle_archive(&cmd),
        "sample.transfer_custody" => commands::custody::handle_transfer(&cmd),
        "equipment.register" => commands::equipment::handle_register(&cmd),
        "equipment.calibrate" => commands::equipment::handle_calibrate(&cmd),
        "method.register" => commands::method::handle_register(&cmd),
        "client.register" => commands::client::handle_register(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    match q.query_type.as_str() {
        "sample.list" => queries::sample::handle_list(&q),
        "sample.search" => queries::sample::handle_search(&q),
        "sample.get" => queries::sample::handle_get(&q),
        "sample.today" => queries::sample::handle_today(&q),
        "test.results" => queries::sample::handle_test_results(&q),
        other => Err(ModuleError::Validation(format!("unknown query: {other}"))),
    }
}
