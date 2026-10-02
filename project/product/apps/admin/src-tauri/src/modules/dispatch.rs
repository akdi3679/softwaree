//! In-process module dispatch.
//!
//! V1 approach: the business modules (medical-reception, food-lab) are
//! called directly as Rust functions, not via Wasmtime. This is a
//! deliberate trade-off documented in ADR-021:
//!
//! - Modules are ours (v1 has no third-party marketplace).
//! - The `handle_command` / `handle_query` interface is identical to
//!   what a WASM module would expose.
//! - Swapping to Wasmtime later is a single-file change in this module.
//!
//! Every command runs inside a transaction: events + audit commit
//! together, or not at all (Principle 4).

use serde_json::{json, Value};
use sqlx::SqlitePool;

use product_module_sdk::command::Command;
use product_module_sdk::{ModuleError, ModuleResult};

use crate::error::{AppError, AppResult};

/// Map a module error to an application error.
fn map_module_error(e: ModuleError) -> AppError {
    match e {
        ModuleError::Validation(m) => AppError::Validation(m),
        ModuleError::NotFound(m) => AppError::NotFound(m),
        ModuleError::Conflict(m) => AppError::Conflict(m),
        ModuleError::InvalidState(m) => AppError::InvalidState(m),
        ModuleError::Internal(m) => AppError::Internal(m),
    }
}

/// Which module handles a given command type?
///
/// The dispatch is by prefix because that is how the SDK is organized:
/// "patient.*", "appointment.*", "visit.*", "certificate.*",
/// "waiting_list.*", "referral.*", "vaccination.*", "lab_order.*",
/// "condition.*", "prescription_template.*" all belong to medical-reception.
fn module_for_command(command_type: &str) -> Option<&'static str> {
    let prefix = command_type.split('.').next().unwrap_or("");
    match prefix {
        "patient" | "appointment" | "visit" | "certificate" | "waiting_list"
        | "referral" | "vaccination" | "lab_order" | "condition"
        | "prescription_template" | "recurring" => Some("medical-reception"),
        "sample" | "test" | "custody" | "equipment" | "method" | "client" | "report" => {
            Some("food-lab")
        }
        _ => None,
    }
}

/// Run a command through the module that owns it.
///
/// Returns the module's `response` JSON on success.
pub async fn run_command(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    command_type: &str,
    payload: &Value,
    idempotency_key: Option<&str>,
    correlation_id: Option<&str>,
) -> AppResult<Value> {
    let module = module_for_command(command_type).ok_or_else(|| {
        AppError::Validation(format!("unknown command prefix: {command_type}"))
    })?;

    // Derive aggregate_type from the command prefix (patient.* -> patient).
    // Modules generate the real aggregate_id themselves; the initializer
    // fields are metadata the module MAY use.
    let aggregate_type = command_type
        .split('.')
        .next()
        .unwrap_or("unknown")
        .to_string();

    let cmd = Command {
        id: uuid::Uuid::new_v4().to_string(),
        command_type: command_type.to_string(),
        aggregate_type,
        aggregate_id: String::new(),
        actor_user_id: actor_user_id.to_string(),
        device_id: device_id.to_string(),
        correlation_id: correlation_id.map(|s| s.to_string()),
        payload: payload.clone(),
        idempotency_key: idempotency_key.map(|s| s.to_string()),
    };

    let cmd_id = cmd.id.clone();
    let outcome: ModuleResult<_> = match module {
        "medical-reception" => medical_reception::handle_command(cmd),
        // "food-lab" => food_lab::handle_command(cmd),  // add when the crate is wired
        other => Err(ModuleError::Internal(format!("module not wired: {other}"))),
    };
    let outcome = outcome.map_err(map_module_error)?;

    // Commit events + audit in one transaction.
    let mut tx = pool.begin().await?;
    for event in &outcome.events {
        sqlx::query(
            "INSERT INTO events \
             (event_id, event_type, aggregate_type, aggregate_id, \
              aggregate_version, actor_user_id, device_id, occurred_at, \
              correlation_id, causation_id, payload) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&event.id)
        .bind(&event.event_type)
        .bind(&event.aggregate_type)
        .bind(&event.aggregate_id)
        .bind(event.version)
        .bind(actor_user_id)
        .bind(device_id)
        .bind(&event.occurred_at)
        .bind(correlation_id)
        .bind(&cmd_id)
        .bind(serde_json::to_string(&event.payload)?)
        .execute(&mut *tx)
        .await?;
    }

    // One audit entry for the whole command.
    let audit_action = command_type;
    let audit_target_type = outcome
        .events
        .first()
        .map(|e| e.aggregate_type.clone());
    let audit_target_id = outcome.events.first().map(|e| e.aggregate_id.clone());
    let audit_details = json!({
        "event_count": outcome.events.len(),
        "response": outcome.response,
    })
    .to_string();

    // Reuse the existing audit writer against this tx.
    // We inline the SQL so we do not need the writer to accept a tx.
    let prev: Option<String> = sqlx::query_scalar(
        "SELECT entry_hash FROM audit_entries ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&mut *tx)
    .await?;
    let prev_hash = prev.unwrap_or_else(|| {
        "0000000000000000000000000000000000000000000000000000000000000000".to_string()
    });
    let now = chrono::Utc::now().to_rfc3339();
    let mut hasher = <sha2::Sha256 as sha2::Digest>::new();
    use sha2::Digest;
    hasher.update(prev_hash.as_bytes());
    hasher.update(audit_action.as_bytes());
    hasher.update(actor_user_id.as_bytes());
    hasher.update(device_id.as_bytes());
    hasher.update(audit_target_type.as_deref().unwrap_or("").as_bytes());
    hasher.update(audit_target_id.as_deref().unwrap_or("").as_bytes());
    hasher.update(b"success");
    hasher.update(audit_details.as_bytes());
    let entry_hash = hex::encode(hasher.finalize());

    sqlx::query(
        "INSERT INTO audit_entries \
         (occurred_at, actor_user_id, actor_device_id, action, \
          target_type, target_id, result, details, prev_hash, entry_hash) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&now)
    .bind(actor_user_id)
    .bind(device_id)
    .bind(audit_action)
    .bind(audit_target_type)
    .bind(audit_target_id)
    .bind("success")
    .bind(&audit_details)
    .bind(&prev_hash)
    .bind(&entry_hash)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(outcome.response)
}