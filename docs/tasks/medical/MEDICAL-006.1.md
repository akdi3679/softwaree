# TASK ID: MEDICAL-006.1
# TITLE: Add medical vaccination records
# STATUS: pending
# DEPENDENCIES: AUDIT-003.3
# ALLOWED FILES: product/modules/medical-reception/src/commands/vaccination.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Record vaccinations for a patient.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/commands/vaccination.rs`:

```rust
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::event::Event;
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct RecordVaccination {
    patient_id: String,
    vaccine: String,
    dose_number: u8,           // 1, 2, 3, ...
    lot_number: String,
    administered_at: String,    // RFC3339
    administered_by: String,    // staff user id
    site: String,               // "left_arm" | "right_arm" | "left_thigh" | "right_thigh" | "oral" | "other"
    next_due: Option<String>,
}

pub fn handle_record(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: RecordVaccination = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.dose_number == 0 { return Err(ModuleError::Validation("dose_number must be >= 1".into())); }
    let allowed_sites = ["left_arm", "right_arm", "left_thigh", "right_thigh", "oral", "other"];
    if !allowed_sites.contains(&req.site.as_str()) {
        return Err(ModuleError::Validation(format!("invalid site: {}", req.site)));
    }
    let id = format!("vac_{}", Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", Uuid::new_v4()),
        event_type: "vaccination.recorded".into(),
        aggregate_type: "vaccination".into(),
        aggregate_id: id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "vaccination_id": id,
            "patient_id": req.patient_id,
            "vaccine": req.vaccine,
            "dose_number": req.dose_number,
            "lot_number": req.lot_number,
            "administered_at": req.administered_at,
            "administered_by": req.administered_by,
            "site": req.site,
            "next_due": req.next_due,
        }),
    };
    Ok(CommandOutcome { events: vec![event], response: json!({ "vaccination_id": id }) })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/commands/vaccination.rs || { echo "FAIL"; exit 1; }
grep -q "handle_record" modules/medical-reception/src/commands/vaccination.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
