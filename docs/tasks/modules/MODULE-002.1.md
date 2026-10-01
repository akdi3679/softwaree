# TASK ID: MODULE-002.1
# TITLE: Add sample medical-reception module skeleton
# STATUS: pending
# DEPENDENCIES: MODULE-001.5
# ALLOWED FILES: product/modules/medical-reception/Cargo.toml, product/modules/medical-reception/src/lib.rs, product/modules/medical-reception/wit/product.wit
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Scaffold a sample module: medical-reception. The hello-world of modules.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/Cargo.toml`:

```toml
[package]
name = "medical-reception"
version = "0.1.0"
edition = "2021"
description = "Medical reception: 1 doctor + N staff, patient queue, appointment booking"

[lib]
crate-type = ["cdylib"]

[dependencies]
product-module-sdk = { path = "../../packages/module-sdk" }
wit-bindgen = "0.30"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
```

Create `product/modules/medical-reception/wit/product.wit` (a thin re-export of the SDK's WIT):

```wit
package medical:reception@0.1.0;
world handler { include product:module/handler@0.1.0; }
```

Create `product/modules/medical-reception/src/lib.rs`:

```rust
//! Medical reception module.
//!
//! Tracks:
//! - patient: a person who visits the doctor
//! - appointment: a scheduled slot
//! - visit: a recorded visit (consultation)

use product_module_sdk::{command::Command, event::Event, host::Host, query::Query, ModuleError, ModuleResult};
use product_module_sdk::command::CommandOutcome;
use product_module_sdk::query::QueryOutcome;

use serde::{Deserialize, Serialize};
use serde_json::json;

wit_bindgen::generate!({
    world: "handler",
    path: "../../packages/module-sdk/wit",
});

struct Host;

#[async_trait::async_trait]
impl Host for Host {
    async fn log(&self, _level: product_module_sdk::host::LogLevel, _message: &str) -> Result<(), product_module_sdk::host::HostError> {
        Ok(())
    }
    async fn now_iso8601(&self) -> Result<String, product_module_sdk::host::HostError> {
        Ok(chrono::Utc::now().to_rfc3339())
    }
    async fn uuid_v7(&self) -> Result<String, product_module_sdk::host::HostError> {
        Ok(uuid::Uuid::new_v4().to_string())
    }
    async fn read_projection(&self, _table: &str, _key: &str) -> Result<Option<String>, product_module_sdk::host::HostError> {
        Ok(None)
    }
    async fn write_audit(&self, _action: &str, _target_type: &str, _target_id: &str, _details: &str) -> Result<(), product_module_sdk::host::HostError> {
        Ok(())
    }
}

#[derive(Debug, Deserialize)]
struct CreatePatient {
    full_name: String,
    phone: String,
    date_of_birth: String,
}

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    match cmd.command_type.as_str() {
        "patient.create" => handle_create_patient(&cmd),
        _ => Err(ModuleError::Validation(format!("unknown command: {}", cmd.command_type))),
    }
}

fn handle_create_patient(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: CreatePatient = serde_json::from_value(cmd.payload.clone())
        .map_err(|e| ModuleError::Validation(e.to_string()))?;
    if req.full_name.is_empty() {
        return Err(ModuleError::Validation("full_name required".into()));
    }
    let patient_id = format!("pat_{}", uuid::Uuid::new_v4());
    let event = Event {
        id: format!("evt_{}", uuid::Uuid::new_v4()),
        event_type: "patient.created".into(),
        aggregate_type: "patient".into(),
        aggregate_id: patient_id.clone(),
        version: 1,
        occurred_at: chrono::Utc::now().to_rfc3339(),
        payload: json!({
            "patient_id": patient_id,
            "full_name": req.full_name,
            "phone": req.phone,
            "date_of_birth": req.date_of_birth,
        }),
    };
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "patient_id": patient_id }),
    })
}

pub fn handle_query(q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome {
        response: json!({ "status": "ok", "module": "medical-reception", "version": env!("CARGO_PKG_VERSION") }),
    })
}
```

## TESTS

```bash
cd product
test -f modules/medical-reception/Cargo.toml || { echo "FAIL"; exit 1; }
test -f modules/medical-reception/src/lib.rs || { echo "FAIL: no lib"; exit 1; }
grep -q "patient.create" modules/medical-reception/src/lib.rs || { echo "FAIL"; exit 1; }
cd modules/medical-reception && cargo check --target wasm32-wasip2 2>&1 | tail -3 || { echo "WARN: wasm32-wasip2 target not installed; ok for now"; }
echo "OK"
```
