# TASK ID: FOODLAB-006.1
# TITLE: Add food-lab: equipment / instrument records
# STATUS: pending
# DEPENDENCIES: MEDICAL-007.2
# ALLOWED FILES: product/modules/food-lab/src/commands/equipment.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Track lab equipment: GC-MS, HPLC, etc. — calibration dates, last used.

## REQUIRED IMPLEMENTATION

Create `product/modules/food-lab/src/commands/equipment.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RegisterEquipment {
    name: String,
    model: String,
    serial: String,
    type_: String,           // "GC" | "HPLC" | "MS" | "FTIR" | "PCR" | "OTHER"
    location: String,
    last_calibration: String,
    next_calibration: String,
}

pub fn handle_register(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RegisterEquipment = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let valid = ["GC", "HPLC", "MS", "FTIR", "PCR", "OTHER"];
    if !valid.contains(&req.type_.as_str()) {
        return Err(ModuleError::Validation(format!("invalid type: {}", req.type_)));
    }
    let id = format!("eq_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "equipment.registered".into(),
        aggregate_type: "equipment".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "equipment_id": id,
            "name": req.name,
            "model": req.model,
            "serial": req.serial,
            "type": req.type_,
            "location": req.location,
            "last_calibration": req.last_calibration,
            "next_calibration": req.next_calibration,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "equipment_id": id }) })
}

#[derive(Debug, Deserialize)]
struct RecordCalibration {
    equipment_id: String,
    calibrated_at: String,
    next_due: String,
    technician_id: String,
    notes: Option<String>,
}

pub fn handle_calibrate(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordCalibration = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "equipment.calibrated".into(),
        aggregate_type: "equipment".into(),
        aggregate_id: req.equipment_id.clone(),
        version: 2,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "equipment_id": req.equipment_id,
            "calibrated_at": req.calibrated_at,
            "next_due": req.next_due,
            "technician_id": req.technician_id,
            "notes": req.notes,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "equipment_id": req.equipment_id, "calibrated": true }) })
}
```

## TESTS

```bash
cd product
test -f modules/food-lab/src/commands/equipment.rs || { echo "FAIL"; exit 1; }
grep -q "handle_register" modules/food-lab/src/commands/equipment.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
