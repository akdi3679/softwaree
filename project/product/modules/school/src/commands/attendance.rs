use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct RecordAttendance {
    student_id: String,
    class_id: String,
    date: String,
    status: String,
    notes: Option<String>,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordAttendance = parse(&cmd.payload)?;
    if !["present", "absent", "late", "excused"].contains(&req.status.as_str()) {
        return Err(ModuleError::Validation(format!("invalid status: {}", req.status)));
    }
    let attendance_id = new_id("att");
    let event = evt("attendance.recorded", "attendance", &attendance_id, 1, json!({
        "attendance_id": attendance_id, "student_id": req.student_id,
        "class_id": req.class_id, "date": req.date,
        "status": req.status, "notes": req.notes,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "attendance_id": attendance_id }) })
}
