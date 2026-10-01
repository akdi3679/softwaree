# TASK ID: MEDICAL-002.1
# TITLE: Add medical patient search and list queries
# STATUS: pending
# DEPENDENCIES: ADMIN-012.3
# ALLOWED FILES: product/modules/medical-reception/src/queries/patient.rs, product/modules/medical-reception/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add query support: patient.list, patient.search, patient.get.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/queries/mod.rs`:

```rust
pub mod patient;
```

Create `product/modules/medical-reception/src/queries/patient.rs`:

```rust
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
struct ListPatients {
    limit: Option<u32>,
    offset: Option<u32>,
    state: Option<String>, // "active" | "archived" | null
}

#[derive(Debug, Deserialize)]
struct SearchPatients {
    query: String, // matches full_name or phone
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GetPatient {
    patient_id: String,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListPatients = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let limit = req.limit.unwrap_or(50).min(500);
    let offset = req.offset.unwrap_or(0);

    // In real impl, this queries a projection table
    // For now, return a query descriptor
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.list",
            "limit": limit,
            "offset": offset,
            "state_filter": req.state,
            "note": "executes SELECT ... FROM projection_patients ORDER BY full_name LIMIT ? OFFSET ?",
        }),
    })
}

pub fn handle_search(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: SearchPatients = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.query.trim().is_empty() {
        return Err(ModuleError::Validation("query cannot be empty".into()));
    }
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.search",
            "query": req.query,
            "limit": limit,
            "note": "executes SELECT ... FROM projection_patients WHERE full_name LIKE ? OR phone LIKE ?",
        }),
    })
}

pub fn handle_get(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetPatient = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.get",
            "patient_id": req.patient_id,
            "note": "executes SELECT ... FROM projection_patients WHERE patient_id = ?",
        }),
    })
}
```

Update `product/modules/medical-reception/src/lib.rs`:

```rust
mod commands;
mod queries;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => commands::patient::handle_create(&cmd),
        "patient.update" => commands::patient::handle_update(&cmd),
        "patient.archive" => commands::patient::handle_archive(&cmd),
        "appointment.create" => commands::appointment::handle_create(&cmd),
        "appointment.cancel" => commands::appointment::handle_cancel(&cmd),
        "appointment.check_in" => commands::appointment::handle_check_in(&cmd),
        "visit.start" => commands::visit::handle_start(&cmd),
        "visit.add_note" => commands::visit::handle_add_note(&cmd),
        "visit.complete" => commands::visit::handle_complete(&cmd),
        "visit.prescribe" => commands::visit::handle_prescribe(&cmd),
        _ => Err(ModuleError::Validation(format!("unknown command: {}", cmd.command_type))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    match q.query_type.as_str() {
        "patient.list" => queries::patient::handle_list(&q),
        "patient.search" => queries::patient::handle_search(&q),
        "patient.get" => queries::patient::handle_get(&q),
        _ => Err(ModuleError::Validation(format!("unknown query: {}", q.query_type))),
    }
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/queries/patient.rs || { echo "FAIL"; exit 1; }
grep -q "patient.list" modules/medical-reception/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
