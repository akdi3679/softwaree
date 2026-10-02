use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct OrderLabTest {
    patient_id: String,
    visit_id: Option<String>,
    test_code: String,
    custom_test_name: Option<String>,
    priority: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RecordResult {
    order_id: String,
    result: serde_json::Value,
    abnormal: bool,
    performed_at: String,
}

pub fn handle_order(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: OrderLabTest = parse(&cmd.payload)?;
    let valid = ["CBC", "BMP", "LIPID", "HBA1C", "TSH", "URINE", "OTHER"];
    if !valid.contains(&req.test_code.as_str()) {
        return Err(ModuleError::Validation(format!("invalid test_code: {}", req.test_code)));
    }
    if !["routine", "urgent", "stat"].contains(&req.priority.as_str()) {
        return Err(ModuleError::Validation(format!("invalid priority: {}", req.priority)));
    }
    if req.test_code == "OTHER" && req.custom_test_name.is_none() {
        return Err(ModuleError::Validation("custom_test_name required for OTHER".into()));
    }
    let order_id = new_id("labord");
    let event = evt("lab_order.created", "lab_order", &order_id, 1, json!({
        "order_id": order_id,
        "patient_id": req.patient_id,
        "visit_id": req.visit_id,
        "test_code": req.test_code,
        "custom_test_name": req.custom_test_name,
        "priority": req.priority,
        "notes": req.notes,
        "status": "pending",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": order_id }) })
}

pub fn handle_record_result(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordResult = parse(&cmd.payload)?;
    let event = evt("lab_order.result_recorded", "lab_order", &req.order_id, 2, json!({
        "order_id": req.order_id,
        "result": req.result,
        "abnormal": req.abnormal,
        "performed_at": req.performed_at,
        "status": "completed",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": req.order_id, "status": "completed" }) })
}
