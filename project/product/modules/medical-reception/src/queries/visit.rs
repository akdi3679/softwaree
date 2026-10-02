use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

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
    doctor_id: Option<String>,
}

pub fn handle_get_full(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetFull = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.get_full",
            "visit_id": req.visit_id,
            "sql": "SELECT payload, occurred_at FROM projection_events WHERE aggregate_id = ? AND event_type LIKE 'visit.%' ORDER BY sequence ASC",
        }),
    })
}

pub fn handle_list_for_patient(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForPatient = parse(&q.payload)?;
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.list_for_patient",
            "patient_id": req.patient_id,
            "from_date": req.from_date,
            "to_date": req.to_date,
            "limit": limit,
            "sql": "SELECT * FROM projection_visits WHERE patient_id = ?",
        }),
    })
}

pub fn handle_active(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ActiveVisits = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "visit.active",
            "doctor_id": req.doctor_id,
            "sql": "SELECT * FROM projection_visits WHERE state = 'in_progress'",
        }),
    })
}
