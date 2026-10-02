use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateSubscription {
    customer_id: String,
    customer_name: String,
    plan_name: String,
    amount_cents: u32,
    currency: String,
    interval: String,
    start_date: String,
    end_date: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateSubscription = parse(&cmd.payload)?;
    if !["USD", "EUR", "SAR", "AED", "EGP"].contains(&req.currency.as_str()) {
        return Err(ModuleError::Validation(format!("invalid currency: {}", req.currency)));
    }
    if !["monthly", "quarterly", "annual"].contains(&req.interval.as_str()) {
        return Err(ModuleError::Validation(format!("invalid interval: {}", req.interval)));
    }
    if req.amount_cents == 0 {
        return Err(ModuleError::Validation("amount must be > 0".into()));
    }
    let subscription_id = new_id("sub");
    let event = evt("subscription.created", "subscription", &subscription_id, 1, json!({
        "subscription_id": subscription_id, "customer_id": req.customer_id,
        "customer_name": req.customer_name, "plan_name": req.plan_name,
        "amount_cents": req.amount_cents, "currency": req.currency,
        "interval": req.interval, "start_date": req.start_date,
        "end_date": req.end_date, "status": "active",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "subscription_id": subscription_id }) })
}
