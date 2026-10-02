use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct CreateBooking {
    room_id: String,
    guest_name: String,
    guest_phone: String,
    check_in: String,
    check_out: String,
    adults: u8,
    children: u8,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CheckIn { booking_id: String, actual_check_in: String }

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateBooking = parse(&cmd.payload)?;
    if req.check_in >= req.check_out {
        return Err(ModuleError::Validation("check_in must be before check_out".into()));
    }
    let booking_id = new_id("bkg");
    let event = evt("booking.created", "booking", &booking_id, 1, json!({
        "booking_id": booking_id, "room_id": req.room_id,
        "guest_name": req.guest_name, "guest_phone": req.guest_phone,
        "check_in": req.check_in, "check_out": req.check_out,
        "adults": req.adults, "children": req.children,
        "notes": req.notes, "status": "reserved",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "booking_id": booking_id }) })
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckIn = parse(&cmd.payload)?;
    let event = evt("booking.checked_in", "booking", &req.booking_id, 2, json!({
        "booking_id": req.booking_id,
        "actual_check_in": req.actual_check_in,
        "status": "checked_in",
    }));
    Ok(CommandOutcome { events: vec![event], response: json!({ "booking_id": req.booking_id, "status": "checked_in" }) })
}
