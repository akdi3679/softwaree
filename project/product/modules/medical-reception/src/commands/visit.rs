use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::errors::e;
use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct StartVisit {
    appointment_id: String,
    patient_id: String,
    chief_complaint: String,
}

#[derive(Debug, Deserialize)]
struct AddVisitNote {
    visit_id: String,
    note: String,
    note_type: String,
}

#[derive(Debug, Deserialize)]
struct CompleteVisit {
    visit_id: String,
    diagnosis: String,
    summary: String,
}

#[derive(Debug, Deserialize)]
struct Prescribe {
    visit_id: String,
    medication: String,
    dosage: String,
    frequency: String,
    duration_days: u32,
}

pub fn handle_start(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: StartVisit = parse(&cmd.payload)?;
    let visit_id = new_id("vis");
    let event = evt("visit.started", "visit", &visit_id, 1, json!({
        "visit_id": visit_id,
        "appointment_id": req.appointment_id,
        "patient_id": req.patient_id,
        "chief_complaint": req.chief_complaint,
        "started_at": chrono::Utc::now().to_rfc3339(),
        "status": "in_progress",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "visit_id": visit_id }) })
}

pub fn handle_add_note(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddVisitNote = parse(&cmd.payload)?;
    if !["subjective", "objective", "assessment", "plan"].contains(&req.note_type.as_str()) {
        return Err(e::invalid_soap_section(&req.note_type));
    }
    let event = evt("visit.note_added", "visit", &req.visit_id, 2, json!({
        "visit_id": req.visit_id,
        "note": req.note,
        "note_type": req.note_type,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "visit_id": req.visit_id }) })
}

pub fn handle_complete(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CompleteVisit = parse(&cmd.payload)?;
    let event = evt("visit.completed", "visit", &req.visit_id, 3, json!({
        "visit_id": req.visit_id,
        "diagnosis": req.diagnosis,
        "summary": req.summary,
        "completed_at": chrono::Utc::now().to_rfc3339(),
        "status": "completed",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "visit_id": req.visit_id, "status": "completed" }) })
}

pub fn handle_prescribe(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: Prescribe = parse(&cmd.payload)?;
    let prescription_id = new_id("rx");
    let event = evt("visit.prescribed", "visit", &req.visit_id, 4, json!({
        "visit_id": req.visit_id,
        "prescription_id": prescription_id,
        "medication": req.medication,
        "dosage": req.dosage,
        "frequency": req.frequency,
        "duration_days": req.duration_days,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "prescription_id": prescription_id }) })
}
