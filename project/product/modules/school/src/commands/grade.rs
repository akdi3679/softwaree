use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct EnterGrade {
    student_id: String,
    class_id: String,
    term: String,
    subject: String,
    score: f32,
    max_score: f32,
    notes: Option<String>,
    entered_by: String,
}

fn letter_for(pct: f32) -> &'static str {
    if pct >= 90.0 { "A" }
    else if pct >= 80.0 { "B" }
    else if pct >= 70.0 { "C" }
    else if pct >= 60.0 { "D" }
    else { "F" }
}

pub fn handle_enter(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: EnterGrade = parse(&cmd.payload)?;
    if !["Q1", "Q2", "Q3", "Q4", "S1", "S2", "FINAL"].contains(&req.term.as_str()) {
        return Err(ModuleError::Validation(format!("invalid term: {}", req.term)));
    }
    if req.max_score <= 0.0 {
        return Err(ModuleError::Validation("max_score must be > 0".into()));
    }
    if req.score < 0.0 || req.score > req.max_score {
        return Err(ModuleError::Validation(format!("score {} out of range", req.score)));
    }
    let pct = (req.score / req.max_score) * 100.0;
    let letter = letter_for(pct);
    let grade_id = new_id("grd");
    let event = evt(
        "grade.entered",
        "grade",
        &grade_id,
        1,
        json!({
            "grade_id": grade_id,
            "student_id": req.student_id,
            "class_id": req.class_id,
            "term": req.term,
            "subject": req.subject,
            "score": req.score,
            "max_score": req.max_score,
            "percentage": pct,
            "letter_grade": letter,
            "notes": req.notes,
            "entered_by": req.entered_by,
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "grade_id": grade_id, "letter_grade": letter }),
    })
}
