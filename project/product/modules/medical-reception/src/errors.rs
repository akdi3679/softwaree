use product_module_sdk::ModuleError;

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
        ModuleError::Validation(format!(
            "invalid SOAP section: {s} (must be subjective|objective|assessment|plan)"
        ))
    }
    pub fn cannot_prescribe_after_complete() -> ModuleError {
        ModuleError::InvalidState("cannot prescribe after visit completed".into())
    }
}

pub fn is_valid_dob(s: &str) -> bool {
    if s.len() != 10 {
        return false;
    }
    let parts: Vec<&str> = s.split('-').collect();
    parts.len() == 3
        && parts[0].len() == 4
        && parts[0].parse::<u32>().is_ok()
        && parts[1].len() == 2
        && parts[1].parse::<u32>().is_ok()
        && parts[2].len() == 2
        && parts[2].parse::<u32>().is_ok()
}

pub fn is_valid_phone(s: &str) -> bool {
    let cleaned: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
    cleaned.len() >= 7 && cleaned.len() <= 15
}
