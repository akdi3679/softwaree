use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;
use serde_json::json;

pub fn handle_list(_q: &Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome {
        response: json!({
            "query_type": "waiting_list.list",
            "sql": "SELECT * FROM projection_waiting_list WHERE status = 'waiting' ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, requested_date ASC",
        }),
    })
}
