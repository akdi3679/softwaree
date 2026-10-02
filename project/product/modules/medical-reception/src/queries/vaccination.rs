use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListVaccinations {
    patient_id: String,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListVaccinations = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "vaccination.list",
            "patient_id": req.patient_id,
            "sql": "SELECT * FROM projection_vaccinations WHERE patient_id = ? ORDER BY administered_at DESC",
        }),
    })
}
