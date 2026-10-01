# TASK ID: FOODLAB-007.1
# TITLE: Add food-lab: standard methods catalog
# STATUS: pending
# DEPENDENCIES: MEDICAL-008.2
# ALLOWED FILES: product/modules/food-lab/src/commands/method.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
ISO/AOAC standard test methods (moisture, ash, protein, etc.).

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/commands/method.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RegisterMethod {
    code: String,           // "AOAC_991.20" | "ISO_16634" | "INTERNAL"
    name: String,           // "Protein (Kjeldahl)"
    description: String,
    category: String,       // "composition" | "microbiological" | "chemistry" | "physics" | "sensory"
    standard_org: String,   // "AOAC" | "ISO" | "FDA" | "INTERNAL"
    estimated_minutes: u16,
    requires_equipment: Vec<String>,  // ["GC", "HPLC"]
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterMethod = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let valid = ["composition", "microbiological", "chemistry", "physics", "sensory"];
    if !valid.contains(&req.category.as_str()) {
        return Err(ModuleError::Validation(format!("invalid category: {}", req.category)));
    }
    let id = format!("meth_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "method.registered".into(),
        aggregate_type: "method".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "method_id": id, "code": req.code, "name": req.name,
            "description": req.description, "category": req.category,
            "standard_org": req.standard_org, "estimated_minutes": req.estimated_minutes,
            "requires_equipment": req.requires_equipment,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "method_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/commands/method.rs || { echo "FAIL"; exit 1; }
grep -q "handle_register" modules/food-lab/src/commands/method.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
