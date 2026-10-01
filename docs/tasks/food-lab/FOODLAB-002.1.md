# TASK ID: FOODLAB-002.1
# TITLE: Add food-lab queries — sample search, today's queue, results
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.8
# ALLOWED FILES: product/modules/food-lab/src/queries/sample.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add queries: sample.list, sample.search, sample.get, sample.today, test.results.

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/queries/mod.rs`:

```rust
pub mod sample;
```

Create `product/modules/food-lab/src/queries/sample.rs`:

```rust
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
struct ListSamples {
    state: Option<String>, // "received" | "in_test" | "results_recorded" | "report_issued" | "rejected" | "archived"
    limit: Option<u32>,
    offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct SearchSamples {
    query: String,        // matches sample_id, client_name, or assigned_tech
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GetSample {
    sample_id: String,
}

#[derive(Debug, Deserialize)]
struct TodayQueue {
    /// None = all labs; Some(name) = specific lab
    lab: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TestResults {
    test_id: String,
}

pub fn handle_list(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListSamples = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let limit = req.limit.unwrap_or(50).min(500);
    let offset = req.offset.unwrap_or(0);
    Ok(QueryOutcome {
        response: json!({
            "query_type": "sample.list",
            "state_filter": req.state,
            "limit": limit,
            "offset": offset,
            "note": "executes SELECT ... FROM projection_samples ORDER BY created_at DESC",
        }),
    })
}

pub fn handle_search(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: SearchSamples = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.query.trim().is_empty() {
        return Err(ModuleError::Validation("query cannot be empty".into()));
    }
    Ok(QueryOutcome {
        response: json!({
            "query_type": "sample.search",
            "query": req.query,
            "note": "executes SELECT ... FROM projection_samples WHERE sample_id LIKE ? OR client_name LIKE ? OR assigned_tech LIKE ?",
        }),
    })
}

pub fn handle_get(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: GetSample = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "sample.get",
            "sample_id": req.sample_id,
            "note": "executes SELECT ... FROM projection_samples WHERE sample_id = ?",
        }),
    })
}

pub fn handle_today(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: TodayQueue = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "sample.today",
            "lab": req.lab,
            "note": "executes SELECT ... FROM projection_samples WHERE created_at LIKE ? AND state IN ('received', 'in_test')",
        }),
    })
}

pub fn handle_test_results(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: TestResults = serde_json::from_value(q.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "test.results",
            "test_id": req.test_id,
            "note": "executes SELECT measurements, passed FROM projection_test_results WHERE test_id = ?",
        }),
    })
}
```

Update `lib.rs` to wire these in.

## TESTS

```bash
cd product
test -f modules/food-lab/src/queries/sample.rs || { echo "FAIL"; exit 1; }
grep -q "sample.today" modules/food-lab/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
