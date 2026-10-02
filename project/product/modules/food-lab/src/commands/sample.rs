use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};
use crate::idempotency;

#[derive(Debug, Deserialize)]
struct Intake {
    client_name: String,
    sample_type: String,
    collected_at: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StartTest {
    sample_id: String,
    test_type: String,
    assigned_tech: String,
}

#[derive(Debug, Deserialize)]
struct RecordResult {
    sample_id: String,
    test_id: String,
    measurements: serde_json::Value,
    passed: bool,
}

#[derive(Debug, Deserialize)]
struct IssueReport {
    sample_id: String,
    recipient_email: String,
}

#[derive(Debug, Deserialize)]
struct RetestSample {
    sample_id: String,
    test_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct RejectSample {
    sample_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct ArchiveSample {
    sample_id: String,
    reason: String,
}

pub fn handle_intake(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: Intake = parse(&cmd.payload)?;
    if req.client_name.trim().is_empty() {
        return Err(ModuleError::Validation("client_name is required".into()));
    }
    if req.sample_type.trim().is_empty() {
        return Err(ModuleError::Validation("sample_type is required".into()));
    }
    let key = cmd.idempotency_key.as_deref().unwrap_or(&cmd.id);
    if let Some(prev) = idempotency::check("sample.intake", key) {
        return Ok(CommandOutcome {
            events: vec![],
            response: json!({ "sample_id": prev, "idempotent_replay": true }),
        });
    }
    let sample_id = new_id("smp");
    let event = evt("sample.received", "sample", &sample_id, 1, json!({
        "sample_id": sample_id,
        "client_name": req.client_name,
        "sample_type": req.sample_type,
        "collected_at": req.collected_at,
        "notes": req.notes,
        "status": "received",
    }));
    idempotency::record("sample.intake", key, &sample_id);
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": sample_id }) })
}

pub fn handle_start_test(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: StartTest = parse(&cmd.payload)?;
    let test_id = new_id("tst");
    let event = evt("sample.test_started", "sample", &req.sample_id, 2, json!({
        "sample_id": req.sample_id,
        "test_id": test_id,
        "test_type": req.test_type,
        "assigned_tech": req.assigned_tech,
        "started_at": chrono::Utc::now().to_rfc3339(),
        "status": "in_test",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "test_id": test_id }) })
}

pub fn handle_record_result(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordResult = parse(&cmd.payload)?;
    let event = evt("sample.result_recorded", "sample", &req.sample_id, 3, json!({
        "sample_id": req.sample_id,
        "test_id": req.test_id,
        "measurements": req.measurements,
        "passed": req.passed,
        "recorded_at": chrono::Utc::now().to_rfc3339(),
        "status": "results_recorded",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": req.sample_id, "status": "results_recorded" }) })
}

pub fn handle_issue_report(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IssueReport = parse(&cmd.payload)?;
    let report_id = new_id("rep");
    let event = evt("sample.report_issued", "sample", &req.sample_id, 4, json!({
        "sample_id": req.sample_id,
        "report_id": report_id,
        "recipient_email": req.recipient_email,
        "issued_at": chrono::Utc::now().to_rfc3339(),
        "status": "report_issued",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "report_id": report_id }) })
}

pub fn handle_retest(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RetestSample = parse(&cmd.payload)?;
    let new_test_id = new_id("tst");
    let event = evt("sample.retest_started", "sample", &req.sample_id, 5, json!({
        "sample_id": req.sample_id,
        "previous_test_id": req.test_id,
        "new_test_id": new_test_id,
        "reason": req.reason,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "new_test_id": new_test_id }) })
}

pub fn handle_reject(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RejectSample = parse(&cmd.payload)?;
    let event = evt("sample.rejected", "sample", &req.sample_id, 6, json!({
        "sample_id": req.sample_id,
        "reason": req.reason,
        "status": "rejected",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": req.sample_id, "status": "rejected" }) })
}

pub fn handle_archive(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ArchiveSample = parse(&cmd.payload)?;
    let event = evt("sample.archived", "sample", &req.sample_id, 7, json!({
        "sample_id": req.sample_id,
        "reason": req.reason,
        "status": "archived",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "sample_id": req.sample_id, "status": "archived" }) })
}
