# TASK ID: MODULE-002.3
# TITLE: Add food-lab module skeleton
# STATUS: pending
# DEPENDENCIES: MODULE-002.2
# ALLOWED FILES: product/modules/food-lab/Cargo.toml, product/modules/food-lab/wit/product.wit, product/modules/food-lab/src/lib.rs, product/modules/food-lab/src/commands/sample.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Scaffold the food-lab module: sample → test → analysis → result → report.

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/Cargo.toml`:

```toml
[package]
name = "food-lab"
version = "0.1.0"
edition = "2021"
description = "Food analysis lab: sample intake, testing, results, reports"

[lib]
crate-type = ["cdylib"]

[dependencies]
product-module-sdk = { path = "../../packages/module-sdk" }
wit-bindgen = "0.30"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
```

Create `product/modules/food-lab/wit/product.wit`:

```wit
package food:lab@0.1.0;
world handler { include product:module/handler@0.1.0; }
```

Create `product/modules/food-lab/src/lib.rs`:

```rust
mod commands;

use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleError;
use product_module_sdk::ModuleResult;

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "sample.intake" => commands::sample::handle_intake(&cmd),
        "sample.start_test" => commands::sample::handle_start_test(&cmd),
        "sample.record_result" => commands::sample::handle_record_result(&cmd),
        "sample.issue_report" => commands::sample::handle_issue_report(&cmd),
        _ => Err(ModuleError::Validation(format!("unknown command: {}", cmd.command_type))),
    }
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome {
        response: serde_json::json!({ "status": "ok" }),
    })
}
```

Create `product/modules/food-lab/src/commands/sample.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleError;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct IntakeSample {
    client_name: String,
    sample_type: String, // e.g., "water", "meat", "dairy"
    collected_at: String,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StartTest {
    sample_id: String,
    test_type: String, // e.g., "pcr", "hplc", "microbiological"
    assigned_tech: String,
}

#[derive(Debug, Deserialize)]
struct RecordResult {
    sample_id: String,
    test_id: String,
    measurements: serde_json::Value, // free-form
    passed: bool,
}

#[derive(Debug, Deserialize)]
struct IssueReport {
    sample_id: String,
    recipient_email: String,
}

pub fn handle_intake(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IntakeSample = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let sample_id = format!("smp_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.intaken".into(),
        aggregate_type: "sample".into(),
        aggregate_id: sample_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": sample_id,
            "client_name": req.client_name,
            "sample_type": req.sample_type,
            "collected_at": req.collected_at,
            "notes": req.notes,
            "status": "received",
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sample_id": sample_id }),
    })
}

pub fn handle_start_test(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: StartTest = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let test_id = format!("tst_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.test_started".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "test_id": test_id,
            "test_type": req.test_type,
            "assigned_tech": req.assigned_tech,
            "started_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "test_id": test_id }),
    })
}

pub fn handle_record_result(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordResult = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.result_recorded".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 3,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "test_id": req.test_id,
            "measurements": req.measurements,
            "passed": req.passed,
            "recorded_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "sample_id": req.sample_id, "test_id": req.test_id }),
    })
}

pub fn handle_issue_report(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IssueReport = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let report_id = format!("rpt_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "sample.report_issued".into(),
        aggregate_type: "sample".into(),
        aggregate_id: req.sample_id.clone(),
        version: 4,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "sample_id": req.sample_id,
            "report_id": report_id,
            "recipient_email": req.recipient_email,
            "issued_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "report_id": report_id }),
    })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/Cargo.toml || { echo "FAIL"; exit 1; }
test -f modules/food-lab/src/commands/sample.rs || { echo "FAIL: no sample"; exit 1; }
grep -q "sample.intake" modules/food-lab/src/lib.rs || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
