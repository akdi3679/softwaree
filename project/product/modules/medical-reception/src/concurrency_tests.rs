//! Concurrency and idempotency tests for the medical-reception module.

#[cfg(test)]
mod tests {
    use crate::commands::{patient, appointment};
    use product_module_sdk::command::Command;
    use product_module_sdk::ModuleError;

    fn make_cmd(command_type: &str, payload: serde_json::Value, idempotency_key: &str) -> Command {
        Command {
            id: format!("cmd_{idempotency_key}"),
            command_type: command_type.to_string(),
            aggregate_type: command_type.split('.').next().unwrap_or("").to_string(),
            aggregate_id: String::new(),
            actor_user_id: "usr_test".to_string(),
            device_id: "dev_test".to_string(),
            correlation_id: None,
            payload,
            idempotency_key: Some(idempotency_key.to_string()),
        }
    }

    #[test]
    fn same_idempotency_key_produces_one_event() {
        let payload = serde_json::json!({
            "full_name": "Test Patient",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
        });
        let key = "key-abc-unique-1";
        let cmd1 = make_cmd("patient.create", payload.clone(), key);
        let cmd2 = make_cmd("patient.create", payload, key);
        let r1 = patient::handle_create(&cmd1).unwrap();
        let r2 = patient::handle_create(&cmd2).unwrap();
        assert_eq!(r1.events.len(), 1, "first call should produce one event");
        assert!(r2.events.is_empty(), "second call should not produce events");
        assert_eq!(r2.response["idempotent_replay"], serde_json::json!(true));
    }

    #[test]
    fn different_keys_produce_different_events() {
        let p1 = serde_json::json!({"full_name": "Patient A", "phone": "+1111111", "date_of_birth": "1990-01-01"});
        let p2 = serde_json::json!({"full_name": "Patient B", "phone": "+2222222", "date_of_birth": "1990-01-01"});
        let r1 = patient::handle_create(&make_cmd("patient.create", p1, "k-diff-1")).unwrap();
        let r2 = patient::handle_create(&make_cmd("patient.create", p2, "k-diff-2")).unwrap();
        assert_ne!(r1.response["patient_id"], r2.response["patient_id"]);
    }

    #[test]
    fn validation_error_no_id() {
        let bad = serde_json::json!({"full_name": "", "phone": "+1111111", "date_of_birth": "1990-01-01"});
        let result = patient::handle_create(&make_cmd("patient.create", bad, "k-bad-1"));
        assert!(result.is_err());
        match result {
            Err(ModuleError::Validation(_)) => (),
            _ => panic!("expected Validation error"),
        }
    }

    #[test]
    fn appointment_duration_must_be_positive() {
        let payload = serde_json::json!({
            "patient_id": "pat_x",
            "scheduled_for": "2026-01-01T10:00:00Z",
            "duration_minutes": 0,
            "reason": "checkup",
        });
        let result = appointment::handle_create(&make_cmd("appointment.create", payload, "k-appt-1"));
        assert!(matches!(result, Err(ModuleError::Validation(_))));
    }

    #[test]
    fn appointment_duration_capped() {
        let payload = serde_json::json!({
            "patient_id": "pat_x",
            "scheduled_for": "2026-01-01T10:00:00Z",
            "duration_minutes": 300,
            "reason": "checkup",
        });
        let result = appointment::handle_create(&make_cmd("appointment.create", payload, "k-appt-2"));
        assert!(matches!(result, Err(ModuleError::Validation(_))));
    }
}
