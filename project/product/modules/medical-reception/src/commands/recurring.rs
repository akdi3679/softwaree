use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::errors::e;
use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateRecurring {
    patient_id: String,
    first_occurrence: String,
    duration_minutes: i64,
    reason: String,
    recurrence: String,
    occurrences: u32,
    doctor_id: Option<String>,
}

pub fn handle_create_recurring(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateRecurring = parse(&cmd.payload)?;
    if req.duration_minutes <= 0 { return Err(e::duration_must_be_positive()); }
    if req.duration_minutes > 240 { return Err(e::duration_too_long()); }
    let allowed = ["daily", "weekly", "biweekly", "monthly"];
    if !allowed.contains(&req.recurrence.as_str()) {
        return Err(product_module_sdk::ModuleError::Validation(format!("invalid recurrence: {}", req.recurrence)));
    }
    if req.occurrences == 0 || req.occurrences > 52 {
        return Err(product_module_sdk::ModuleError::Validation("occurrences must be 1..=52".into()));
    }
    let series_id = new_id("aptseries");
    let event = evt("appointment.series_created", "appointment_series", &series_id, 1, json!({
        "series_id": series_id,
        "patient_id": req.patient_id,
        "first_occurrence": req.first_occurrence,
        "duration_minutes": req.duration_minutes,
        "reason": req.reason,
        "recurrence": req.recurrence,
        "occurrences": req.occurrences,
        "doctor_id": req.doctor_id,
        "status": "active",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "series_id": series_id }) })
}
