# TASK ID: MODULE-006.1
# TITLE: Add module: hotel management (rooms, bookings)
# STATUS: pending
# DEPENDENCIES: CHAOS-004.2
# ALLOWED FILES: product/modules/hotel/src/commands/room.rs, product/modules/hotel/src/commands/booking.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Hotel module: rooms, bookings, check-in/out.

## REQUIRED IMPLEMENTATION

Create `product/modules/hotel/src/commands/room.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct AddRoom {
    number: String,
    type_: String,         // "single" | "double" | "suite" | "family"
    nightly_rate_cents: u32,
    max_occupancy: u8,
    floor: u8,
}

pub fn handle_add(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: AddRoom = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if !["single", "double", "suite", "family"].contains(&req.type_.as_str()) {
        return Err(ModuleError::Validation(format!("invalid type: {}", req.type_)));
    }
    let id = format!("room_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "room.added".into(),
        aggregate_type: "room".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "room_id": id, "number": req.number, "type": req.type_,
            "nightly_rate_cents": req.nightly_rate_cents, "max_occupancy": req.max_occupancy,
            "floor": req.floor,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "room_id": id }) })
}
```

Create `product/modules/hotel/src/commands/booking.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct CreateBooking {
    room_id: String,
    guest_name: String,
    guest_phone: String,
    check_in: String,    // YYYY-MM-DD
    check_out: String,
    adults: u8,
    children: u8,
    notes: Option<String>,
}

pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreateBooking = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.check_in >= req.check_out {
        return Err(ModuleError::Validation("check_in must be before check_out".into()));
    }
    let id = format!("bkg_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "booking.created".into(),
        aggregate_type: "booking".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "booking_id": id, "room_id": req.room_id,
            "guest_name": req.guest_name, "guest_phone": req.guest_phone,
            "check_in": req.check_in, "check_out": req.check_out,
            "adults": req.adults, "children": req.children,
            "notes": req.notes, "status": "reserved",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "booking_id": id }) })
}

#[derive(Debug, Deserialize)]
struct CheckIn {
    booking_id: String,
    actual_check_in: String,
}

pub fn handle_check_in(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CheckIn = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "booking.checked_in".into(),
        aggregate_type: "booking".into(),
        aggregate_id: req.booking_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "booking_id": req.booking_id,
            "actual_check_in": req.actual_check_in,
            "status": "checked_in",
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "status": "checked_in" }) })
}
```

## TESTS

```bash
cd product
test -f modules/hotel/src/commands/room.rs || { echo "FAIL"; exit 1; }
test -f modules/hotel/src/commands/booking.rs || { echo "FAIL: no booking"; exit 1; }
echo "OK"
```
