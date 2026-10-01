# TASK ID: MODULE-004.2
# TITLE: Add module: gym full implementation
# STATUS: pending
# DEPENDENCIES: MODULE-004.1
# ALLOWED FILES: product/modules/gym/src/commands/member.rs, product/modules/gym/src/commands/class.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Gym module: members, classes, check-ins.

## REQUIRED IMPLEMENTATION

Create `product/modules/gym/src/commands/member.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateMember {
    full_name: String,
    email: String,
    phone: String,
    membership_type: String,  // "monthly" | "annual" | "day_pass"
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateMember = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["monthly", "annual", "day_pass"].contains(&req.membership_type.as_str()) {
        return Err(ModuleError::Validation(format!("invalid membership_type: {}", req.membership_type)));
    }
    let id = format!("mem_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "member.created".into(),
        aggregate_type: "member".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "member_id": id, "full_name": req.full_name, "email": req.email,
            "phone": req.phone, "membership_type": req.membership_type,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "member_id": id }) })
}

#[derive(Debug, Deserialize)]
struct CheckIn {
    member_id: String,
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckIn = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "member.checked_in".into(),
        aggregate_type: "member".into(),
        aggregate_id: req.member_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "member_id": req.member_id,
            "checked_in_at": chrono::Utc::now().to_rfc3339(),
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "member_id": req.member_id, "status": "checked_in" }) })
}
```

Create `product/modules/gym/src/commands/class.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct BookClass {
    class_id: String,
    member_id: String,
}

pub fn handle_book(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: BookClass = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| product_module_sdk::ModuleError::Validation(e.to_string()))?;
    let booking_id = format!("bkg_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "class.booked".into(),
        aggregate_type: "class".into(),
        aggregate_id: req.class_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "class_id": req.class_id, "member_id": req.member_id,
            "booking_id": booking_id,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "booking_id": booking_id }) })
}
```

## TESTS

```bash
cd product
test -f modules/gym/src/commands/member.rs || { echo "FAIL"; exit 1; }
test -f modules/gym/src/commands/class.rs || { echo "FAIL: no class"; exit 1; }
echo "OK"
```
