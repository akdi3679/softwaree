use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct BookClass { class_id: String, member_id: String }

pub fn handle_book(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: BookClass = parse(&cmd.payload)?;
    let booking_id = new_id("bkg");
    let event = evt("class.booked", "class", &req.class_id, 1, json!({
        "class_id": req.class_id, "member_id": req.member_id, "booking_id": booking_id,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "booking_id": booking_id }) })
}
