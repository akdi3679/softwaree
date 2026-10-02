use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct AddRoom {
    number: String,
    #[serde(rename = "type")]
    type_: String,
    nightly_rate_cents: u32,
    max_occupancy: u8,
    floor: u8,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddRoom = parse(&cmd.payload)?;
    if !["single", "double", "suite", "family"].contains(&req.type_.as_str()) {
        return Err(ModuleError::Validation(format!("invalid type: {}", req.type_)));
    }
    let room_id = new_id("room");
    let event = evt("room.added", "room", &room_id, 1, json!({
        "room_id": room_id, "number": req.number, "type": req.type_,
        "nightly_rate_cents": req.nightly_rate_cents, "max_occupancy": req.max_occupancy,
        "floor": req.floor,
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "room_id": room_id }) })
}
