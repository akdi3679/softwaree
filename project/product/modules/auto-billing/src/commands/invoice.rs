use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct IssueInvoice {
    subscription_id: String,
    period_start: String,
    period_end: String,
    due_days: u8,
}

pub fn handle_issue(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IssueInvoice = parse(&cmd.payload)?;
    let due = chrono::NaiveDate::parse_from_str(&req.period_end, "%Y-%m-%d")
        .map_err(|e| ModuleError::Validation(e.to_string()))?
        .checked_add_signed(chrono::Duration::days(req.due_days as i64))
        .ok_or_else(|| ModuleError::Validation("invalid due_days".into()))?
        .to_string();
    let invoice_id = new_id("inv");
    let event = evt("invoice.issued", "invoice", &invoice_id, 1, json!({
        "invoice_id": invoice_id, "subscription_id": req.subscription_id,
        "period_start": req.period_start, "period_end": req.period_end,
        "due_date": due, "status": "issued",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "invoice_id": invoice_id, "due_date": due }) })
}
