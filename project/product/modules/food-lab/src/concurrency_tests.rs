#[cfg(test)]
mod tests {
    use crate::commands::sample;
    use product_module_sdk::command::Command;
    use product_module_sdk::ModuleError;

    fn make_cmd(command_type: &str, payload: serde_json::Value, key: &str) -> Command {
        Command {
            id: format!("cmd_{key}"),
            command_type: command_type.to_string(),
            aggregate_type: "sample".to_string(),
            aggregate_id: String::new(),
            actor_user_id: "usr_test".into(),
            device_id: "dev_test".into(),
            correlation_id: None,
            payload,
            idempotency_key: Some(key.to_string()),
        }
    }

    #[test]
    fn intake_idempotent() {
        let p = serde_json::json!({"client_name": "Acme", "sample_type": "water", "collected_at": "2026-01-01T00:00:00Z"});
        let r1 = sample::handle_intake(&make_cmd("sample.intake", p.clone(), "k-flab-1")).unwrap();
        let r2 = sample::handle_intake(&make_cmd("sample.intake", p, "k-flab-1")).unwrap();
        assert_eq!(r1.events.len(), 1);
        assert_eq!(r2.events.len(), 0);
        assert_eq!(r2.response["idempotent_replay"], serde_json::json!(true));
    }

    #[test]
    fn missing_client_name_errors() {
        let p = serde_json::json!({"client_name": "", "sample_type": "water", "collected_at": "2026-01-01T00:00:00Z"});
        let r = sample::handle_intake(&make_cmd("sample.intake", p, "k-flab-bad"));
        assert!(matches!(r, Err(ModuleError::Validation(_))));
    }

    #[test]
    fn custody_same_user_errors() {
        use crate::commands::custody;
        let p = serde_json::json!({"sample_id": "smp_x", "from_user": "u1", "to_user": "u1", "location": "lab", "reason": "storage"});
        let r = custody::handle_transfer(&make_cmd("sample.transfer_custody", p, "k-cust"));
        assert!(matches!(r, Err(ModuleError::Validation(_))));
    }
}
