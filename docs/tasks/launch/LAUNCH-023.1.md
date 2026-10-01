# TASK ID: LAUNCH-023.1
# TITLE: Add sample module depth: school (grades + report cards)
# STATUS: pending
# DEPENDENCIES: LAUNCH-022.2
# ALLOWED FILES: product/modules/school/src/commands/grade.rs, product/modules/school/src/commands/report_card.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Grade entry + report card generation.

## REQUIRED IMPLEMENTATION

Create `product/modules/school/src/commands/grade.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct EnterGrade {
    student_id: String,
    class_id: String,
    term: String,         // "Q1" | "Q2" | "Q3" | "Q4" | "S1" | "S2" | "FINAL"
    subject: String,      // "math" | "english" | "science" | ...
    score: f32,           // 0-100
    max_score: f32,       // usually 100
    notes: Option<String>,
    entered_by: String,   // staff user id
}

pub fn handle_enter(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: EnterGrade = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["Q1", "Q2", "Q3", "Q4", "S1", "S2", "FINAL"].contains(&req.term.as_str()) {
        return Err(ModuleError::Validation(format!("invalid term: {}", req.term)));
    }
    if req.score < 0.0 || req.score > req.max_score {
        return Err(ModuleError::Validation(format!("score {} out of [0, {}]", req.score, req.max_score)));
    }
    if req.max_score <= 0.0 {
        return Err(ModuleError::Validation("max_score must be > 0".into()));
    }
    let pct = (req.score / req.max_score) * 100.0;
    let letter = match pct {
        p if p >= 93.0 => 'A',
        p if p >= 90.0 => 'A',
        p if p >= 87.0 => 'B',
        p if p >= 83.0 => 'B',
        p if p >= 80.0 => 'B',
        p if p >= 77.0 => 'C',
        p if p >= 73.0 => 'C',
        p if p >= 70.0 => 'C',
        p if p >= 67.0 => 'D',
        p if p >= 60.0 => 'D',
        _ => 'F',
    };
    let id = format!("grd_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "grade.entered".into(),
        aggregate_type: "grade".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "grade_id": id,
            "student_id": req.student_id,
            "class_id": req.class_id,
            "term": req.term,
            "subject": req.subject,
            "score": req.score,
            "max_score": req.max_score,
            "percentage": pct,
            "letter_grade": letter.to_string(),
            "notes": req.notes,
            "entered_by": req.entered_by,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "grade_id": id, "letter_grade": letter.to_string() }) })
}
```

Create `product/modules/school/src/commands/report_card.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct GenerateReportCard {
    student_id: String,
    term: String,
    comments: Option<String>,
}

pub fn handle_generate(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: GenerateReportCard = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| product_module_sdk::ModuleError::Validation(e.to_string()))?;
    let id = format!("rc_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "report_card.generated".into(),
        aggregate_type: "report_card".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "report_card_id": id,
            "student_id": req.student_id,
            "term": req.term,
            "comments": req.comments,
            "generated_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "report_card_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/school/src/commands/grade.rs || { echo "FAIL"; exit 1; }
test -f modules/school/src/commands/report_card.rs || { echo "FAIL: no report"; exit 1; }
echo "OK"
```
