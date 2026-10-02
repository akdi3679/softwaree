//! Product Module SDK — the contract every WASM module implements.
//!
//! Modules receive `Command` and `Query` envelopes from the host and return
//! `CommandOutcome` / `QueryOutcome`. The host owns transactions, audit,
//! authorization, and outbox. Modules produce events only.

pub mod capability;
pub mod command;
pub mod event;
pub mod query;

pub use command::{Command, CommandOutcome};
pub use event::Event;
pub use query::{Query, QueryOutcome};
pub use capability::Capability;

use thiserror::Error;

#[derive(Debug, Error, serde::Serialize)]
pub enum ModuleError {
    #[error("validation: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("invalid state: {0}")]
    InvalidState(String),
    #[error("internal: {0}")]
    Internal(String),
}

pub type ModuleResult<T> = Result<T, ModuleError>;
