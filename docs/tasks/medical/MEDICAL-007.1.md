# TASK ID: MEDICAL-007.1
# TITLE: Add medical: lab test orders
# STATUS: pending
# DEPENDENCIES: ADMIN-016.3
# ALLOWED FILES: product/modules/medical-reception/src/commands/lab_order.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Order lab tests for a patient (CBC, glucose, etc.).

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/lab_order.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct OrderLabTest {
    patient_id: String,
    visit_id: Option<String>,
    test_code: String,         // "CBC" | "BMP" | "LIPID" | "HBA1C" | "TSH" | "URINE" | "OTHER"
    custom_test_name: Option<String>,
    priority: String,          // "routine" | "urgent" | "stat"
    notes: Option<String>,
}

pub fn handle_order(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: OrderLabTest = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let valid = ["CBC", "BMP", "LIPID", "HBA1C", "TSH", "URINE", "OTHER"];
    if !valid.contains(&req.test_code.as_str()) {
        return Err(ModuleError::Validation(format!("invalid test_code: {}", req.test_code)));
    }
    if !["routine", "urgent", "stat"].contains(&req.priority.as_str()) {
        return Err(ModuleError::Validation(format!("invalid priority: {}", req.priority)));
    }
    if req.test_code == "OTHER" && req.custom_test_name.is_none() {
        return Err(ModuleError::Validation("custom_test_name required for OTHER".into()));
    }
    let id = format!("labord_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "lab_order.created".into(),
        aggregate_type: "lab_order".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "order_id": id,
            "patient_id": req.patient_id,
            "visit_id": req.visit_id,
            "test_code": req.test_code,
            "custom_test_name": req.custom_test_name,
            "priority": req.priority,
            "notes": req.notes,
            "status": "pending",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": id }) })
}

#[derive(Debug, Deserialize)]
struct RecordResult {
    order_id: String,
    result: serde_json::Value,
    abnormal: bool,
    performed_at: String,
}

pub fn handle_record_result(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordResult = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "lab_order.result_recorded".into(),
        aggregate_type: "lab_order".into(),
        aggregate_id: req.order_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "order_id": req.order_id,
            "result": req.result,
            "abnormal": req.abnormal,
            "performed_at": req.performed_at,
            "status": "completed",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "order_id": req.order_id, "status": "completed" }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/lab_order.rs || { echo "FAIL"; exit 1; }
grep -q "handle_order" modules/medical-reception/src/commands/lab_order.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
