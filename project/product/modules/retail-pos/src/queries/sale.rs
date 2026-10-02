use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde_json::json;

pub fn handle_today(_q: &Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: json!({
        "query_type": "sale.today",
        "sql": "SELECT * FROM projection_sales WHERE created_at LIKE ?",
    }) })
}
