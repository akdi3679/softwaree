use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::errors::{e, is_valid_dob, is_valid_phone};
use crate::helpers::{evt, new_id, parse};
use crate::idempotency;

#[derive(Debug, Deserialize)]
struct CreatePatient {
    full_name: String,
    phone: String,
    date_of_birth: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UpdatePatient {
    patient_id: String,
    full_name: Option<String>,
    phone: Option<String>,
    date_of_birth: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ArchivePatient {
    patient_id: String,
    reason: String,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreatePatient = parse(&cmd.payload)?;
    if req.full_name.trim().is_empty() { return Err(e::full_name_required()); }
    if req.phone.trim().is_empty() { return Err(e::phone_required()); }
    if !is_valid_dob(&req.date_of_birth) { return Err(e::invalid_dob(&req.date_of_birth)); }
    if !is_valid_phone(&req.phone) { return Err(e::invalid_phone(&req.phone)); }
    let key = cmd.idempotency_key.as_deref().unwrap_or(&cmd.id);
    if let Some(prev) = idempotency::check("patient.create", key) {
        return Ok(CommandOutcome {
            events: vec![],
            response: json!({ "patient_id": prev, "idempotent_replay": true }),
        });
    }
    let patient_id = new_id("pat");
    let event = evt("patient.created", "patient", &patient_id, 1, json!({
        "patient_id": patient_id,
        "full_name": req.full_name,
        "phone": req.phone,
        "date_of_birth": req.date_of_birth,
        "notes": req.notes,
        "state": "active",
    }));
    idempotency::record("patient.create", key, &patient_id);
    Ok(CommandOutcome { events: vec![event], response: json!({ "patient_id": patient_id }) })
}

pub fn handle_update(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: UpdatePatient = parse(&cmd.payload)?;
    let event = evt("patient.updated", "patient", &req.patient_id, 2, json!({
        "patient_id": req.patient_id,
        "full_name": req.full_name,
        "phone": req.phone,
        "date_of_birth": req.date_of_birth,
        "notes": req.notes,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "patient_id": req.patient_id }) })
}

pub fn handle_archive(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ArchivePatient = parse(&cmd.payload)?;
    let event = evt("patient.archived", "patient", &req.patient_id, 3, json!({
        "patient_id": req.patient_id,
        "reason": req.reason,
        "state": "archived",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "patient_id": req.patient_id, "status": "archived" }) })
}
