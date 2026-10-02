use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RecordVaccination {
    patient_id: String,
    vaccine: String,
    dose_number: u8,
    lot_number: String,
    administered_at: String,
    administered_by: String,
    site: String,
    next_due: Option<String>,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordVaccination = parse(&cmd.payload)?;
    if req.dose_number == 0 {
        return Err(ModuleError::Validation("dose_number must be >= 1".into()));
    }
    let allowed_sites = ["left_arm", "right_arm", "left_thigh", "right_thigh", "oral", "other"];
    if !allowed_sites.contains(&req.site.as_str()) {
        return Err(ModuleError::Validation(format!("invalid site: {}", req.site)));
    }
    let vaccination_id = new_id("vac");
    let event = evt("vaccination.recorded", "vaccination", &vaccination_id, 1, json!({
        "vaccination_id": vaccination_id,
        "patient_id": req.patient_id,
        "vaccine": req.vaccine,
        "dose_number": req.dose_number,
        "lot_number": req.lot_number,
        "administered_at": req.administered_at,
        "administered_by": req.administered_by,
        "site": req.site,
        "next_due": req.next_due,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "vaccination_id": vaccination_id }) })
}
