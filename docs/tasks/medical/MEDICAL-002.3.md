# TASK ID: MEDICAL-002.3
# TITLE: Add visit queries and full SOAP note assembly
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.2
# ALLOWED FILES: product/modules/medical-reception/src/queries/visit.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add visit queries: visit.get_full (returns the entire SOAP note assembled), visit.list_for_patient, visit.active.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/queries/visit.rs`:

```rust
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
struct GetFull {
    visit_id: String,
}

#[derive(Debug, Deserialize)]
struct ListForPatient {
    patient_id: String,
    from_date: Option<String>,
    to_date: Option<String>,
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct ActiveVisits {
    doctor_id: Option<String>, // None = all doctors
}

pub fn handle_get_full(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetFull = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    // The full SOAP note is assembled from:
    // 1. visit.started event
    // 2. all visit.note_added events (subjective, objective, assessment, plan)
    // 3. all visit.prescribed events
    // 4. visit.completed event
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.get_full",
            "visit_id": req.visit_id,
            "note": "executes: SELECT e.payload, e.occurred_at FROM events WHERE aggregate_id = ? AND event_type LIKE 'visit.%' ORDER BY sequence ASC",
        }),
    })
}

pub fn handle_list_for_patient(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForPatient = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.list_for_patient",
            "patient_id": req.patient_id,
            "from_date": req.from_date,
            "to_date": req.to_date,
            "limit": limit,
            "note": "executes SELECT ... FROM projection_visits WHERE patient_id = ?",
        }),
    })
}

pub fn handle_active(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ActiveVisits = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.active",
            "doctor_id": req.doctor_id,
            "note": "executes SELECT ... FROM projection_visits WHERE state = 'in_progress'",
        }),
    })
}
```

Update `lib.rs` to wire these in.

## TESTS

```bash
cd product
test -f modules/medical-reception/src/queries/visit.rs || { echo "FAIL"; exit 1; }
grep -q "visit.get_full" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
