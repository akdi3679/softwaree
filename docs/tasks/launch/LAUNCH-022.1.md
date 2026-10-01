# TASK ID: LAUNCH-022.1
# TITLE: Add sample module depth: gym (membership renewals)
# STATUS: pending
# DEPENDENCIES: LAUNCH-021.2
# ALLOWED FILES: product/modules/gym/src/commands/renewal.rs, product/modules/gym/src/commands/payment.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Membership renewals + payments.

## REQUIRED IMPLEMENTATION

Create `product/modules/gym/src/commands/renewal.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RenewMembership {
    member_id: String,
    new_plan: String,    // "monthly" | "annual"
    new_end_date: String, // YYYY-MM-DD
    amount_cents: u32,
    paid_at: String,
}

pub fn handle_renew(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RenewMembership = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["monthly", "annual"].contains(&req.new_plan.as_str()) {
        return Err(ModuleError::Validation(format!("invalid new_plan: {}", req.new_plan)));
    }
    let id = format!("ren_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "membership.renewed".into(),
        aggregate_type: "membership".into(),
        aggregate_id: req.member_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "renewal_id": id,
            "member_id": req.member_id,
            "new_plan": req.new_plan,
            "new_end_date": req.new_end_date,
            "amount_cents": req.amount_cents,
            "paid_at": req.paid_at,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "renewal_id": id }) })
}
```

Create `product/modules/gym/src/commands/payment.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RecordPayment {
    member_id: String,
    amount_cents: u32,
    method: String,   // "cash" | "card" | "transfer" | "check"
    reference: Option<String>,  // check number, transfer ref
    paid_at: String,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordPayment = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["cash", "card", "transfer", "check"].contains(&req.method.as_str()) {
        return Err(ModuleError::Validation(format!("invalid method: {}", req.method)));
    }
    if req.amount_cents == 0 {
        return Err(ModuleError::Validation("amount must be > 0".into()));
    }
    let id = format!("pay_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "payment.recorded".into(),
        aggregate_type: "payment".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "payment_id": id,
            "member_id": req.member_id,
            "amount_cents": req.amount_cents,
            "method": req.method,
            "reference": req.reference,
            "paid_at": req.paid_at,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "payment_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/gym/src/commands/renewal.rs || { echo "FAIL"; exit 1; }
test -f modules/gym/src/commands/payment.rs || { echo "FAIL: no payment"; exit 1; }
echo "OK"
```
