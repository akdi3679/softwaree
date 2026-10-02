//! medical-reception module — source-only for Session 12.
//!
//! Every handler returns events; the host (Admin) is responsible for
//! transactions, authorization, audit, and outbox. Wasmtime wiring is
//! deferred (see SESSION_MEMORY Open Deferred Items).

pub mod commands;
pub mod errors;
pub mod helpers;
pub mod idempotency;
pub mod queries;
pub mod reports;

#[cfg(test)]
pub mod concurrency_tests;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => commands::patient::handle_create(&cmd),
        "patient.update" => commands::patient::handle_update(&cmd),
        "patient.archive" => commands::patient::handle_archive(&cmd),
        "appointment.create" => commands::appointment::handle_create(&cmd),
        "appointment.cancel" => commands::appointment::handle_cancel(&cmd),
        "appointment.check_in" => commands::appointment::handle_check_in(&cmd),
        "appointment.create_recurring" => commands::recurring::handle_create_recurring(&cmd),
        "visit.start" => commands::visit::handle_start(&cmd),
        "visit.add_note" => commands::visit::handle_add_note(&cmd),
        "visit.complete" => commands::visit::handle_complete(&cmd),
        "visit.prescribe" => commands::visit::handle_prescribe(&cmd),
        "certificate.issue" => commands::medical_certificate::handle_issue(&cmd),
        "waiting_list.add" => commands::waiting_list::handle_add(&cmd),
        "waiting_list.remove" => commands::waiting_list::handle_remove(&cmd),
        "referral.create" => commands::referral::handle_create(&cmd),
        "vaccination.record" => commands::vaccination::handle_record(&cmd),
        "lab_order.create" => commands::lab_order::handle_order(&cmd),
        "lab_order.record_result" => commands::lab_order::handle_record_result(&cmd),
        "condition.add" => commands::condition::handle_add(&cmd),
        "condition.resolve" => commands::condition::handle_resolve(&cmd),
        "prescription_template.create" => commands::prescription_template::handle_create(&cmd),
        other => Err(ModuleError::Validation(format!("unknown command: {other}"))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    match q.query_type.as_str() {
        "patient.list" => queries::patient::handle_list(&q),
        "patient.search" => queries::patient::handle_search(&q),
        "patient.get" => queries::patient::handle_get(&q),
        "appointment.list_for_day" => queries::appointment::handle_list_for_day(&q),
        "appointment.next_available" => queries::appointment::handle_next_available(&q),
        "appointment.list_for_patient" => queries::appointment::handle_list_for_patient(&q),
        "visit.get_full" => queries::visit::handle_get_full(&q),
        "visit.list_for_patient" => queries::visit::handle_list_for_patient(&q),
        "visit.active" => queries::visit::handle_active(&q),
        "lab_order.list_for_patient" => queries::lab_order::handle_list_for_patient(&q),
        "lab_order.list_pending" => queries::lab_order::handle_list_pending(&q),
        "waiting_list.list" => queries::waiting_list::handle_list(&q),
        "referral.list" => queries::referral::handle_list(&q),
        "vaccination.list" => queries::vaccination::handle_list(&q),
        other => Err(ModuleError::Validation(format!("unknown query: {other}"))),
    }
}
