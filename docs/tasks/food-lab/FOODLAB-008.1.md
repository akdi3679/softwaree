# TASK ID: FOODLAB-008.1
# TITLE: Add food-lab: customer/clients
# STATUS: pending
# DEPENDENCIES: MEDICAL-009.2
# ALLOWED FILES: product/modules/food-lab/src/commands/client.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Track who submits samples (clients/factories).

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/commands/client.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RegisterClient {
    name: String,
    company_type: String,    // "manufacturer" | "importer" | "retailer" | "restaurant" | "other"
    contact_name: String,
    contact_email: String,
    contact_phone: String,
    address: String,
    license_number: Option<String>,
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterClient = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let valid = ["manufacturer", "importer", "retailer", "restaurant", "other"];
    if !valid.contains(&req.company_type.as_str()) {
        return Err(ModuleError::Validation(format!("invalid company_type: {}", req.company_type)));
    }
    let id = format!("cli_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "client.registered".into(),
        aggregate_type: "client".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "client_id": id, "name": req.name, "company_type": req.company_type,
            "contact_name": req.contact_name, "contact_email": req.contact_email,
            "contact_phone": req.contact_phone, "address": req.address,
            "license_number": req.license_number,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "client_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/commands/client.rs || { echo "FAIL"; exit 1; }
grep -q "handle_register" modules/food-lab/src/commands/client.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
