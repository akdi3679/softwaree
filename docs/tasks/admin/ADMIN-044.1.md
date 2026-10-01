# TASK ID: ADMIN-044.1
# TITLE: Add Admin: drug interaction warnings (medical)
# STATUS: pending
# DEPENDENCIES: USER-021.2
# ALLOWED FILES: product/modules/medical-reception/src/commands/drug_interaction.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When prescribing, check patient's current meds for interactions.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/drug_interaction.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CheckInteraction {
    patient_id: String,
    new_medication: String,        // e.g., "ibuprofen"
    new_dose: String,              // e.g., "400mg"
}

pub fn handle_check(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckInteraction = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| product_module_sdk::ModuleError::Validation(e.to_string()))?;
    // v1: simple hard-coded list. v2: integrate with DrugBank.
    let warnings = match req.new_medication.to_lowercase().as_str() {
        "warfarin" => vec![("aspirin", "Increased bleeding risk")],
        "ibuprofen" => vec![("warfarin", "Increased bleeding risk"), ("lithium", "Increased lithium levels")],
        "metformin" => vec![("contrast_dye", "Risk of lactic acidosis")],
        _ => vec![],
    };
    let id = format!("check_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "drug_interaction.checked".into(),
        aggregate_type: "drug_interaction_check".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "check_id": id,
            "patient_id": req.patient_id,
            "new_medication": req.new_medication,
            "warnings": warnings.iter().map(|(d, w)| json!({ "drug": d, "warning": w })).collect::<Vec<_>>(),
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "check_id": id, "warnings": warnings }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/drug_interaction.rs || { echo "FAIL"; exit 1; }
grep -q "handle_check" modules/medical-reception/src/commands/drug_interaction.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
