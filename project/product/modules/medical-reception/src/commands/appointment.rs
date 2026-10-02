use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::errors::e;
use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateAppointment {
    patient_id: String,
    scheduled_for: String,
    duration_minutes: i64,
    reason: String,
    doctor_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CancelAppointment {
    appointment_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct CheckIn {
    appointment_id: String,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateAppointment = parse(&cmd.payload)?;
    if req.duration_minutes <= 0 { return Err(e::duration_must_be_positive()); }
    if req.duration_minutes > 240 { return Err(e::duration_too_long()); }
    let appointment_id = new_id("apt");
    let event = evt("appointment.created", "appointment", &appointment_id, 1, json!({
        "appointment_id": appointment_id,
        "patient_id": req.patient_id,
        "scheduled_for": req.scheduled_for,
        "duration_minutes": req.duration_minutes,
        "reason": req.reason,
        "doctor_id": req.doctor_id,
        "status": "scheduled",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "appointment_id": appointment_id }) })
}

pub fn handle_cancel(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CancelAppointment = parse(&cmd.payload)?;
    let event = evt("appointment.cancelled", "appointment", &req.appointment_id, 2, json!({
        "appointment_id": req.appointment_id,
        "reason": req.reason,
        "status": "cancelled",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "appointment_id": req.appointment_id, "status": "cancelled" }) })
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckIn = parse(&cmd.payload)?;
    let event = evt("appointment.checked_in", "appointment", &req.appointment_id, 2, json!({
        "appointment_id": req.appointment_id,
        "status": "checked_in",
        "checked_in_at": chrono::Utc::now().to_rfc3339(),
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "appointment_id": req.appointment_id, "status": "checked_in" }) })
}
