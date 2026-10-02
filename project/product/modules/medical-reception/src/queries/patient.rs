use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListPatients {
    limit: Option<u32>,
    offset: Option<u32>,
    state: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SearchPatients {
    query: String,
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GetPatient {
    patient_id: String,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListPatients = parse(&q.payload)?;
    let limit = req.limit.unwrap_or(50).min(500);
    let offset = req.offset.unwrap_or(0);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.list",
            "limit": limit,
            "offset": offset,
            "state_filter": req.state,
            "sql": "SELECT * FROM projection_patients ORDER BY full_name LIMIT ? OFFSET ?",
        }),
    })
}

pub fn handle_search(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: SearchPatients = parse(&q.payload)?;
    if req.query.trim().is_empty() {
        return Err(ModuleError::Validation("query cannot be empty".into()));
    }
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.search",
            "query": req.query,
            "limit": limit,
            "sql": "SELECT * FROM projection_patients WHERE full_name LIKE ? OR phone LIKE ?",
        }),
    })
}

pub fn handle_get(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetPatient = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "patient.get",
            "patient_id": req.patient_id,
            "sql": "SELECT * FROM projection_patients WHERE patient_id = ?",
        }),
    })
}
