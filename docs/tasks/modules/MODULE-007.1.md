# TASK ID: MODULE-007.1
# TITLE: Add module: auto-billing / invoicing for customers
# STATUS: pending
# DEPENDENCIES: SECURITY-009.2
# ALLOWED FILES: product/modules/auto-billing/src/commands/subscription.rs, product/modules/auto-billing/src/commands/invoice.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Module for customers that need recurring billing (e.g., gym memberships, SaaS).

## REQUIRED IMPLEMENTATION

Create `product/modules/auto-billing/src/commands/subscription.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateSubscription {
    customer_id: String,
    customer_name: String,
    plan_name: String,
    amount_cents: u32,
    currency: String,    // "USD" | "EUR" | "SAR" | "AED" | "EGP"
    interval: String,    // "monthly" | "quarterly" | "annual"
    start_date: String,  // YYYY-MM-DD
    end_date: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateSubscription = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["USD", "EUR", "SAR", "AED", "EGP"].contains(&req.currency.as_str()) {
        return Err(ModuleError::Validation(format!("invalid currency: {}", req.currency)));
    }
    if !["monthly", "quarterly", "annual"].contains(&req.interval.as_str()) {
        return Err(ModuleError::Validation(format!("invalid interval: {}", req.interval)));
    }
    if req.amount_cents == 0 {
        return Err(ModuleError::Validation("amount must be > 0".into()));
    }
    let id = format!("sub_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "subscription.created".into(),
        aggregate_type: "subscription".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "subscription_id": id, "customer_id": req.customer_id,
            "customer_name": req.customer_name, "plan_name": req.plan_name,
            "amount_cents": req.amount_cents, "currency": req.currency,
            "interval": req.interval, "start_date": req.start_date,
            "end_date": req.end_date, "status": "active",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "subscription_id": id }) })
}
```

Create `product/modules/auto-billing/src/commands/invoice.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct IssueInvoice {
    subscription_id: String,
    period_start: String,  // YYYY-MM-DD
    period_end: String,
    due_days: u8,          // net 7, net 15, net 30
}

pub fn handle_issue(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IssueInvoice = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| product_module_sdk::ModuleError::Validation(e.to_string()))?;
    let id = format!("inv_{}", Uuid::new_v4());
    let due = chrono::NaiveDate::parse_from_str(&req.period_end, "%Y-%m-%d")
        .map_err(|e| product_module_sdk::ModuleError::Validation(e.to_string()))?
        .checked_add_signed(chrono::Duration::days(req.due_days as i64))
        .ok_or_else(|| product_module_sdk::ModuleError::Validation("invalid due_days".into()))?
        .to_string();
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "invoice.issued".into(),
        aggregate_type: "invoice".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "invoice_id": id, "subscription_id": req.subscription_id,
            "period_start": req.period_start, "period_end": req.period_end,
            "due_date": due, "status": "issued",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "invoice_id": id, "due_date": due }) })
}
```

## TESTS

```bash
cd product
test -f modules/auto-billing/src/commands/subscription.rs || { echo "FAIL"; exit 1; }
test -f modules/auto-billing/src/commands/invoice.rs || { echo "FAIL: no invoice"; exit 1; }
echo "OK"
```
