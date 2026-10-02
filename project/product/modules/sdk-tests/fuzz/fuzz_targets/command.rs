#![no_main]
use libfuzzer_sys::fuzz_target;
use product_module_sdk::command::Command;
use arbitrary::Arbitrary;

#[derive(Debug, Arbitrary)]
struct FuzzCommand {
    id: String,
    command_type: String,
    aggregate_type: String,
    aggregate_id: String,
    actor_user_id: String,
    device_id: String,
    correlation_id: Option<String>,
    payload_json: String,
}

fuzz_target!(|data: FuzzCommand| {
    let payload = serde_json::from_str(&data.payload_json)
        .unwrap_or(serde_json::Value::Null);
    let cmd = Command {
        id: data.id,
        command_type: data.command_type,
        aggregate_type: data.aggregate_type,
        aggregate_id: data.aggregate_id,
        actor_user_id: data.actor_user_id,
        device_id: data.device_id,
        correlation_id: data.correlation_id,
        payload,
        idempotency_key: None,
    };
    let _ = serde_json::to_string(&cmd);
});
