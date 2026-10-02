use crate::error::AppResult;

pub mod project;
pub mod ping;
pub mod engine;
pub mod handlers;
pub mod backup;
pub mod audit;
pub mod modules_cmd;
pub mod auth;
pub mod settings;
pub mod module_query;
pub mod module_cmd;
pub mod csv_import;
pub mod device_replace;
pub mod latency_hooks;
pub mod data_quality;
pub mod api_client;
pub mod event_search;
pub mod idempotency;
pub mod batch;
pub mod update_check;
pub mod maintenance;
pub mod validate_event;
pub mod cron;
pub mod billing;
pub mod gdpr_export;
pub mod cloud;
pub mod notifications;
pub mod gdpr;
pub mod diag;
pub mod analytics;

/// Dispatch a command inside an existing transaction.
///
/// The sync handshake calls this from `CommandApplyRequest`. The
/// transaction already covers the events + audit + outbox writes
/// (the caller owns commit / rollback).
///
/// Command types not listed here are rejected with `NotFound`. Real
/// per-domain handlers land as each module is wired; until then the
/// `__test__.noop` command exists so the handshake can be exercised
/// end to end without pulling in a module.
pub async fn dispatch(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    actor: &str,
    device: &str,
    command_type: &str,
    payload: &serde_json::Value,
) -> AppResult<serde_json::Value> {
    match command_type {
        // Test-only, writes nothing, echoes the payload.
        "__test__.noop" => Ok(serde_json::json!({
            "noop": true,
            "actor": actor,
            "device": device,
            "payload": payload,
        })),
        _ => {
            let _ = (tx, actor, device, payload);
            Err(crate::error::AppError::NotFound(format!(
                "unknown command: {command_type}"
            )))
        }
    }
}
pub mod pdf;
pub mod totp;
