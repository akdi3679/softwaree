use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListForPatient {
    patient_id: String,
    include_completed: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct ListPending {
    priority: Option<String>,
    limit: Option<u32>,
}

pub fn handle_list_for_patient(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForPatient = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "lab_order.list_for_patient",
            "patient_id": req.patient_id,
            "include_completed": req.include_completed.unwrap_or(true),
            "sql": "SELECT * FROM projection_lab_orders WHERE patient_id = ? ORDER BY created_at DESC",
        }),
    })
}

pub fn handle_list_pending(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListPending = parse(&q.payload)?;
    if let Some(ref p) = req.priority {
        if !["routine", "urgent", "stat"].contains(&p.as_str()) {
            return Err(ModuleError::Validation(format!("invalid priority: {p}")));
        }
    }
    let limit = req.limit.unwrap_or(100).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "lab_order.list_pending",
            "priority": req.priority,
            "limit": limit,
            "sql": "SELECT * FROM projection_lab_orders WHERE status = 'pending' ORDER BY priority DESC, created_at ASC",
        }),
    })
}
