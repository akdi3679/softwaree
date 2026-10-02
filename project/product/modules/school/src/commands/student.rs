use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct EnrollStudent {
    full_name: String,
    date_of_birth: String,
    grade_level: u8,
    guardian_contact: String,
}

pub fn handle_enroll(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: EnrollStudent = parse(&cmd.payload)?;
    if req.grade_level == 0 || req.grade_level > 12 {
        return Err(ModuleError::Validation("grade_level must be 1-12".into()));
    }
    let student_id = new_id("stu");
    let event = evt("student.enrolled", "student", &student_id, 1, json!({
        "student_id": student_id, "full_name": req.full_name,
        "date_of_birth": req.date_of_birth, "grade_level": req.grade_level,
        "guardian_contact": req.guardian_contact,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "student_id": student_id }) })
}
