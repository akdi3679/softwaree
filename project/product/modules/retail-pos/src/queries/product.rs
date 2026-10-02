use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde_json::json;

pub fn handle_list(_q: &Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: json!({
        "query_type": "product.list",
        "sql": "SELECT * FROM projection_products ORDER BY name ASC",
    }) })
}
