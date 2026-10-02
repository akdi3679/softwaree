use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListReferrals {
    status: Option<String>,
    patient_id: Option<String>,
    limit: Option<u32>,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListReferrals = parse(&q.payload).unwrap_or(ListReferrals { status: None, patient_id: None, limit: None });
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "referral.list",
            "status": req.status,
            "patient_id": req.patient_id,
            "limit": limit,
            "sql": "SELECT * FROM projection_referrals WHERE (status = ? OR ? IS NULL) ORDER BY created_at DESC LIMIT ?",
        }),
    })
}
