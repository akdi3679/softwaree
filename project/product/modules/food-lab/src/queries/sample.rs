use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListSamples {
    state: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct SearchSamples {
    query: String,
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GetSample {
    sample_id: String,
}

#[derive(Debug, Deserialize)]
struct TodayQueue {
    lab: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TestResults {
    test_id: String,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListSamples = parse(&q.payload)?;
    let limit = req.limit.unwrap_or(50).min(500);
    let offset = req.offset.unwrap_or(0);
    Ok(QueryOutcome { response: json!({
        "query_type": "sample.list",
        "state_filter": req.state,
        "limit": limit,
        "offset": offset,
        "sql": "SELECT * FROM projection_samples ORDER BY created_at DESC LIMIT ? OFFSET ?",
    }) })
}

pub fn handle_search(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: SearchSamples = parse(&q.payload)?;
    if req.query.trim().is_empty() {
        return Err(ModuleError::Validation("query cannot be empty".into()));
    }
    let limit = req.limit.unwrap_or(50).min(500);
    Ok(QueryOutcome { response: json!({
        "query_type": "sample.search",
        "query": req.query,
        "limit": limit,
        "sql": "SELECT * FROM projection_samples WHERE sample_id LIKE ? OR client_name LIKE ? OR assigned_tech LIKE ?",
    }) })
}

pub fn handle_get(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetSample = parse(&q.payload)?;
    Ok(QueryOutcome { response: json!({
        "query_type": "sample.get",
        "sample_id": req.sample_id,
        "sql": "SELECT * FROM projection_samples WHERE sample_id = ?",
    }) })
}

pub fn handle_today(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: TodayQueue = parse(&q.payload).unwrap_or(TodayQueue { lab: None });
    Ok(QueryOutcome { response: json!({
        "query_type": "sample.today",
        "lab": req.lab,
        "sql": "SELECT * FROM projection_samples WHERE created_at LIKE ? AND state IN ('received', 'in_test')",
    }) })
}

pub fn handle_test_results(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: TestResults = parse(&q.payload)?;
    Ok(QueryOutcome { response: json!({
        "query_type": "test.results",
        "test_id": req.test_id,
        "sql": "SELECT measurements, passed FROM projection_test_results WHERE test_id = ?",
    }) })
}
