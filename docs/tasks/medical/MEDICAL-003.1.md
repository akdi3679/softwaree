# TASK ID: MEDICAL-003.1
# TITLE: Add medical common error paths (validation, conflicts, not-found)
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.8
# ALLOWED FILES: product/modules/medical-reception/src/errors.rs, product/modules/medical-reception/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define a comprehensive error catalog for the medical module — every command returns one of these errors.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/src/errors.rs`:

```rust
use product_module_sdk::ModuleError;

/// All errors the medical-reception module can return.
/// Use these helpers for consistent error messages across handlers.
pub mod e {
    use super::*;

    pub fn patient_not_found(id: &str) -> ModuleError {
        ModuleError::NotFound(format!("patient {id} not found"))
    }
    pub fn appointment_not_found(id: &str) -> ModuleError {
        ModuleError::NotFound(format!("appointment {id} not found"))
    }
    pub fn visit_not_found(id: &str) -> ModuleError {
        ModuleError::NotFound(format!("visit {id} not found"))
    }
    pub fn patient_archived(id: &str) -> ModuleError {
        ModuleError::Conflict(format!("patient {id} is archived; cannot modify"))
    }
    pub fn appointment_already_cancelled(id: &str) -> ModuleError {
        ModuleError::Conflict(format!("appointment {id} already cancelled"))
    }
    pub fn appointment_already_completed(id: &str) -> ModuleError {
        ModuleError::Conflict(format!("appointment {id} already completed"))
    }
    pub fn visit_already_completed(id: &str) -> ModuleError {
        ModuleError::Conflict(format!("visit {id} already completed"))
    }
    pub fn visit_not_in_progress(id: &str) -> ModuleError {
        ModuleError::InvalidState(format!("visit {id} not in progress"))
    }
    pub fn full_name_required() -> ModuleError {
        ModuleError::Validation("full_name is required".into())
    }
    pub fn phone_required() -> ModuleError {
        ModuleError::Validation("phone is required".into())
    }
    pub fn dob_required() -> ModuleError {
        ModuleError::Validation("date_of_birth is required (YYYY-MM-DD)".into())
    }
    pub fn invalid_phone(s: &str) -> ModuleError {
        ModuleError::Validation(format!("invalid phone: {s}"))
    }
    pub fn invalid_dob(s: &str) -> ModuleError {
        ModuleError::Validation(format!("invalid date_of_birth: {s} (expected YYYY-MM-DD)"))
    }
    pub fn duration_must_be_positive() -> ModuleError {
        ModuleError::Validation("duration_minutes must be > 0".into())
    }
    pub fn duration_too_long() -> ModuleError {
        ModuleError::Validation("duration_minutes must be <= 240 (4 hours)".into())
    }
    pub fn invalid_soap_section(s: &str) -> ModuleError {
        ModuleError::Validation(format!("invalid SOAP section: {s} (must be subjective|objective|assessment|plan)"))
    }
    pub fn cannot_prescribe_after_complete() -> ModuleError {
        ModuleError::InvalidState("cannot prescribe after visit completed".into())
    }
}
```

Update `product/modules/medical-reception/src/commands/patient.rs` to use these:

```rust
use crate::errors::e;
// ...
pub fn handle_create(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreatePatient = serde_json::from_value(cmd.payload.clone())?;
    if req.full_name.trim().is_empty() { return Err(e::full_name_required()); }
    if req.phone.trim().is_empty() { return Err(e::phone_required()); }
    if !is_valid_dob(&req.date_of_birth) { return Err(e::invalid_dob(&req.date_of_birth)); }
    if !is_valid_phone(&req.phone) { return Err(e::invalid_phone(&req.phone)); }
    // ... rest as before
}

fn is_valid_dob(s: &str) -> bool {
    s.len() == 10 && s.split('-').count() == 3
}

fn is_valid_phone(s: &str) -> bool {
    let cleaned: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
    cleaned.len() >= 7 && cleaned.len() <= 15
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/src/errors.rs || { echo "FAIL"; exit 1; }
grep -q "patient_not_found" modules/medical-reception/src/errors.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
