# TASK ID: FOODLAB-001.1
# TITLE: Add more sample commands (re-test, reject, archive)
# STATUS: pending
# DEPENDENCIES: MEDICAL-001.2
# ALLOWED FILES: product/modules/food-lab/src/commands/sample.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add sample.retest, sample.reject, sample.archive commands to the food-lab module.

## REQUIRED IMPLEMENTATION

Append to `product/modules/food-lab/src/commands/sample.rs`:

```rust
#[derive(Debug, Deserialize)]
struct RetestSample {
    sample_id: String,
    test_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct RejectSample {
    sample_id: String,
    reason: String,
}

#[derive(Debug, Deserialize)]
struct ArchiveSample {
    sample_id: String,
    reason: String,
}

pub fn handle_retest(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RetestSample = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let new_test_id = format!("tst_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.retest_started".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 5,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "previous_test_id": req.test_id,
            "new_test_id": new_test_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "new_test_id": new_test_id }),
    })
}

pub fn handle_reject(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RejectSample = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.rejected".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 6,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sample_id": req.sample_id, "status": "rejected" }),
    })
}

pub fn handle_archive(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: ArchiveSample = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.archived".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 7,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "reason": req.reason,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sample_id": req.sample_id, "status": "archived" }),
    })
}
```

Update `product/modules/food-lab/src/lib.rs`:

```rust
mod commands;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "sample.intake" => commands::sample::handle_intake(&cmd),
        "sample.start_test" => commands::sample::handle_start_test(&cmd),
        "sample.record_result" => commands::sample::handle_record_result(&cmd),
        "sample.issue_report" => commands::sample::handle_issue_report(&cmd),
        "sample.retest" => commands::sample::handle_retest(&cmd),
        "sample.reject" => commands::sample::handle_reject(&cmd),
        "sample.archive" => commands::sample::handle_archive(&cmd),
        _ => Err(ModuleError::Validation(format!("unknown command: {}", cmd.command_type))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome { response: serde_json::json!({ "status": "ok" }) })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/commands/sample.rs || { echo "FAIL"; exit 1; }
grep -q "sample.retest" modules/food-lab/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
