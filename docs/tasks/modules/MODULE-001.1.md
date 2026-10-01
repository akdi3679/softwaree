# TASK ID: MODULE-001.1
# TITLE: Add module SDK (Rust crate with Wasmtime-compatible types)
# STATUS: pending
# DEPENDENCIES: USER-004.7
# ALLOWED FILES: product/packages/module-sdk/Cargo.toml, product/packages/module-sdk/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a Rust crate that module authors depend on. Provides the host interface types.

## REQUIRED IMPLEMENTATION

Create `product/packages/module-sdk/Cargo.toml`:

```toml
[package]
name = "product-module-sdk"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
wit-bindgen-rt = "0.30"  # maps to wasmtime component model
```

Create `product/packages/module-sdk/src/lib.rs`:

```rust
//! SDK for Product modules.
//!
//! A module is a WebAssembly component that implements the
//! `product:module/handler` world. It receives commands and queries
//! from the host and returns events or data.

pub mod command;
pub mod event;
pub mod query;
pub mod host;
pub mod capability;
pub mod result;
pub mod error;

pub use command::Command;
pub use event::Event;
pub use query::Query;
pub use host::{Host, HostError};
pub use capability::Capability;
pub use result::ModuleResult;
pub use error::ModuleError;
```

Create the rest:

```rust
// command.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub id: String,
    pub command_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub actor_user_id: String,
    pub device_id: String,
    pub correlation_id: Option<String>,
    pub payload: Value,
}

// event.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub aggregate_type: String,
    pub aggregate_id: String,
    pub version: i64,
    pub occurred_at: String,
    pub payload: Value,
}

// query.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Query {
    pub id: String,
    pub query_type: String,
    pub payload: Value,
}

// host.rs
use crate::error::ModuleError;

#[async_trait::async_trait]
pub trait Host: Send + Sync {
    async fn log(&self, level: LogLevel, message: &str) -> Result<(), HostError>;
    async fn now_iso8601(&self) -> Result<String, HostError>;
    async fn uuid_v7(&self) -> Result<String, HostError>;
    async fn read_projection(&self, table: &str, key: &str) -> Result<Option<String>, HostError>;
    async fn write_audit(&self, action: &str, target_type: &str, target_id: &str, details: &str) -> Result<(), HostError>;
}

#[derive(Debug, Clone, Copy)]
pub enum LogLevel { Debug, Info, Warn, Error }

#[derive(Debug, thiserror::Error)]
pub enum HostError {
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("internal: {0}")]
    Internal(String),
}

impl From<ModuleError> for HostError {
    fn from(e: ModuleError) -> Self {
        HostError::Internal(e.to_string())
    }
}

// capability.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    pub name: String,
    pub scope: String,
    pub reason: String,
}

// result.rs
use crate::error::ModuleError;
use crate::event::Event;

pub type ModuleResult<T> = Result<T, ModuleError>;

#[derive(Debug, Clone)]
pub struct CommandOutcome {
    pub events: Vec<Event>,
    pub response: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct QueryOutcome {
    pub response: serde_json::Value,
}

// error.rs
use thiserror::Error;
use serde::Serialize;

#[derive(Debug, Error, Serialize)]
pub enum ModuleError {
    #[error("validation: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("internal: {0}")]
    Internal(String),
}
```

Add to `product/pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## TESTS

```bash
cd product
test -f packages/module-sdk/Cargo.toml || { echo "FAIL"; exit 1; }
test -f packages/module-sdk/src/lib.rs || { echo "FAIL"; exit 1; }
grep -q "product-module-sdk" packages/module-sdk/Cargo.toml || { echo "FAIL: no name"; exit 1; }
echo "OK"
```
