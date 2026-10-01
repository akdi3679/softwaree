# TASK ID: MODULE-004.3
# TITLE: Add module: school full implementation
# STATUS: pending
# DEPENDENCIES: MODULE-004.2
# ALLOWED FILES: product/modules/school/src/commands/student.rs, product/modules/school/src/commands/attendance.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
School module: students, classes, attendance, grades.

## REQUIRED IMPLEMENTATION

Create `product/modules/school/src/commands/student.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct EnrollStudent {
    full_name: String,
    date_of_birth: String,
    grade_level: u8,
    guardian_contact: String,
}

pub fn handle_enroll(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: EnrollStudent = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.grade_level == 0 || req.grade_level > 12 {
        return Err(ModuleError::Validation("grade_level must be 1-12".into()));
    }
    let id = format!("stu_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "student.enrolled".into(),
        aggregate_type: "student".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "student_id": id, "full_name": req.full_name,
            "date_of_birth": req.date_of_birth, "grade_level": req.grade_level,
            "guardian_contact": req.guardian_contact,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "student_id": id }) })
}
```

Create `product/modules/school/src/commands/attendance.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RecordAttendance {
    student_id: String,
    class_id: String,
    date: String,        // YYYY-MM-DD
    status: String,      // "present" | "absent" | "late" | "excused"
    notes: Option<String>,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordAttendance = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["present", "absent", "late", "excused"].contains(&req.status.as_str()) {
        return Err(ModuleError::Validation(format!("invalid status: {}", req.status)));
    }
    let id = format!("att_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "attendance.recorded".into(),
        aggregate_type: "attendance".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "attendance_id": id, "student_id": req.student_id,
            "class_id": req.class_id, "date": req.date,
            "status": req.status, "notes": req.notes,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "attendance_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/school/src/commands/student.rs || { echo "FAIL"; exit 1; }
test -f modules/school/src/commands/attendance.rs || { echo "FAIL: no attendance"; exit 1; }
echo "OK"
```
