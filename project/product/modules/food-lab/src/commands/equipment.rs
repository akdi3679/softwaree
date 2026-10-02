use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RegisterEquipment {
    name: String,
    model: String,
    serial: String,
    #[serde(rename = "type")]
    type_: String,
    location: String,
    last_calibration: String,
    next_calibration: String,
}

#[derive(Debug, Deserialize)]
struct RecordCalibration {
    equipment_id: String,
    calibrated_at: String,
    next_due: String,
    technician_id: String,
    notes: Option<String>,
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterEquipment = parse(&cmd.payload)?;
    let valid = ["GC", "HPLC", "MS", "FTIR", "PCR", "OTHER"];
    if !valid.contains(&req.type_.as_str()) {
        return Err(ModuleError::Validation(format!("invalid type: {}", req.type_)));
    }
    let equipment_id = new_id("eq");
    let event = evt("equipment.registered", "equipment", &equipment_id, 1, json!({
        "equipment_id": equipment_id,
        "name": req.name,
        "model": req.model,
        "serial": req.serial,
        "type": req.type_,
        "location": req.location,
        "last_calibration": req.last_calibration,
        "next_calibration": req.next_calibration,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "equipment_id": equipment_id }) })
}

pub fn handle_calibrate(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordCalibration = parse(&cmd.payload)?;
    let event = evt("equipment.calibrated", "equipment", &req.equipment_id, 2, json!({
        "equipment_id": req.equipment_id,
        "calibrated_at": req.calibrated_at,
        "next_due": req.next_due,
        "technician_id": req.technician_id,
        "notes": req.notes,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "equipment_id": req.equipment_id, "calibrated": true }) })
}
