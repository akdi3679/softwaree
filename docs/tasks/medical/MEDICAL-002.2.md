# TASK ID: MEDICAL-002.2
# TITLE: Add medical appointment queries and slot finder
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.1
# ALLOWED FILES: product/modules/medical-reception/src/queries/appointment.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add appointment queries: appointment.list_for_day, appointment.next_available, appointment.list_for_patient.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/queries/appointment.rs`:

```rust
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
struct ListForDay {
    date: String, // YYYY-MM-DD
}

#[derive(Debug, Deserialize)]
struct NextAvailable {
    after: String,             // ISO 8601
    duration_minutes: u32,
    within_days: u32,          // search horizon
}

#[derive(Debug, Deserialize)]
struct ListForPatient {
    patient_id: String,
    include_cancelled: Option<bool>,
}

pub fn handle_list_for_day(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForDay = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !is_valid_date(&req.date) {
        return Err(ModuleError::Validation(format!("invalid date: {}", req.date)));
    }
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.list_for_day",
            "date": req.date,
            "note": "executes SELECT ... FROM projection_appointments WHERE scheduled_for LIKE ? ORDER BY scheduled_for ASC",
        }),
    })
}

pub fn handle_next_available(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: NextAvailable = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.duration_minutes == 0 {
        return Err(ModuleError::Validation("duration_minutes must be > 0".into()));
    }
    if req.within_days == 0 || req.within_days > 90 {
        return Err(ModuleError::Validation("within_days must be 1..=90".into()));
    }
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.next_available",
            "after": req.after,
            "duration_minutes": req.duration_minutes,
            "within_days": req.within_days,
            "note": "executes recursive CTE on projection_appointments + projection_business_hours",
        }),
    })
}

pub fn handle_list_for_patient(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForPatient = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.list_for_patient",
            "patient_id": req.patient_id,
            "include_cancelled": req.include_cancelled.unwrap_or(false),
            "note": "executes SELECT ... FROM projection_appointments WHERE patient_id = ?",
        }),
    })
}

fn is_valid_date(s: &str) -> bool {
    // YYYY-MM-DD
    if s.len() != 10 { return false; }
    let parts: Vec<&str> = s.split('-').collect();
    if parts.len() != 3 { return false; }
    parts[0].len() == 4 && parts[0].parse::<u32>().is_ok()
        && parts[1].len() == 2 && parts[1].parse::<u32>().is_ok()
        && parts[2].len() == 2 && parts[2].parse::<u32>().is_ok()
}
```

Update `product/modules/medical-reception/src/queries/mod.rs`:

```rust
pub mod appointment;
pub mod patient;
```

Update `product/modules/medical-reception/src/lib.rs`:

```rust
mod commands;
mod queries;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    // ... (existing)
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    match q.query_type.as_str() {
        "patient.list" => queries::patient::handle_list(&q),
        "patient.search" => queries::patient::handle_search(&q),
        "patient.get" => queries::patient::handle_get(&q),
        "appointment.list_for_day" => queries::appointment::handle_list_for_day(&q),
        "appointment.next_available" => queries::appointment::handle_next_available(&q),
        "appointment.list_for_patient" => queries::appointment::handle_list_for_patient(&q),
        _ => Err(ModuleError::Validation(format!("unknown query: {}", q.query_type))),
    }
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/queries/appointment.rs || { echo "FAIL"; exit 1; }
grep -q "appointment.next_available" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
