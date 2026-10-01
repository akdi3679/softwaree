# TASK ID: MEDICAL-009.1
# TITLE: Add medical: prescription template system
# STATUS: pending
# DEPENDENCIES: ADMIN-023.2
# ALLOWED FILES: product/modules/medical-reception/src/commands/prescription_template.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Templates for common prescriptions (e.g., "common cold", "allergy").

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/prescription_template.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateTemplate {
    name: String,
    diagnosis_code: Option<String>,    // ICD-10
    items: Vec<TemplateItem>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TemplateItem {
    medication: String,
    dose: String,        // "500mg"
    frequency: String,   // "3x/day" or "every 8h"
    duration: String,    // "7 days"
    instructions: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateTemplate = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.items.is_empty() {
        return Err(ModuleError::Validation("items required".into()));
    }
    let id = format!("tmpl_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "prescription_template.created".into(),
        aggregate_type: "prescription_template".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "template_id": id,
            "name": req.name,
            "diagnosis_code": req.diagnosis_code,
            "items": req.items,
            "notes": req.notes,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "template_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/prescription_template.rs || { echo "FAIL"; exit 1; }
grep -q "handle_create" modules/medical-reception/src/commands/prescription_template.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
