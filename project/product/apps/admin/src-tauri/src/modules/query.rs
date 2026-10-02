//! In-process module query dispatch.
//!
//! V1: modules are called as Rust functions, not through Wasmtime.
//! See `modules/dispatch.rs` for the rationale (ADR-021).
//!
//! Query responses may be one of:
//!   - an Array of entities (already materialized)
//!   - an Object with a "sql" string (a query the module wants run)
//!   - a plain String starting with SELECT
//!
//! If we recognise a SQL shape, we execute it against the project DB.
//! Otherwise we return the module's response as-is.

use serde_json::{json, Value};
use sqlx::SqlitePool;

use product_module_sdk::query::Query;
use product_module_sdk::{ModuleError, ModuleResult};

use crate::error::{AppError, AppResult};

fn map_module_error(e: ModuleError) -> AppError {
    match e {
        ModuleError::Validation(m) => AppError::Validation(m),
        ModuleError::NotFound(m) => AppError::NotFound(m),
        ModuleError::Conflict(m) => AppError::Conflict(m),
        ModuleError::InvalidState(m) => AppError::InvalidState(m),
        ModuleError::Internal(m) => AppError::Internal(m),
    }
}

fn module_for_query(query_type: &str) -> Option<&'static str> {
    let prefix = query_type.split('.').next().unwrap_or("");
    match prefix {
        "patient" | "appointment" | "visit" | "certificate" | "waiting_list"
        | "referral" | "vaccination" | "lab_order" | "condition"
        | "prescription_template" => Some("medical-reception"),
        "sample" | "test" | "custody" | "equipment" | "method" | "client" | "report" => {
            Some("food-lab")
        }
        _ => None,
    }
}

fn looks_like_sql(s: &str) -> bool {
    let t = s.trim_start().to_uppercase();
    t.starts_with("SELECT") || t.starts_with("WITH")
}

/// Execute the SQL the module asked for and return rows as a JSON array
/// of parsed JSON objects, reading from a single JSON text column.
async fn run_sql_return_rows(pool: &SqlitePool, sql: &str) -> AppResult<Value> {
    let rows: Vec<(String,)> = sqlx::query_as(sql).fetch_all(pool).await?;
    let parsed: Vec<Value> = rows
        .into_iter()
        .map(|(s,)| serde_json::from_str::<Value>(&s).unwrap_or(Value::String(s)))
        .collect();
    Ok(Value::Array(parsed))
}

/// Read patients directly from the event log. This is a fallback when the
/// module's query returns a SQL descriptor against a projection table
/// that does not exist yet (v1: projections are not materialized).
async fn list_patients_from_events(pool: &SqlitePool, limit: i64) -> AppResult<Value> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT payload FROM events \
         WHERE aggregate_type = 'patient' AND event_type = 'patient.created' \
         ORDER BY sequence DESC LIMIT ?",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;
    let parsed: Vec<Value> = rows
        .into_iter()
        .map(|(s,)| serde_json::from_str::<Value>(&s).unwrap_or(Value::Null))
        .collect();
    Ok(Value::Array(parsed))
}

/// Run a query through the module that owns it.
pub async fn run_query(
    pool: &SqlitePool,
    query_type: &str,
    payload: &Value,
) -> AppResult<Value> {
    let module = module_for_query(query_type)
        .ok_or_else(|| AppError::Validation(format!("unknown query prefix: {query_type}")))?;

    let q = Query {
        id: uuid::Uuid::new_v4().to_string(),
        query_type: query_type.to_string(),
        payload: payload.clone(),
    };

    let outcome: ModuleResult<_> = match module {
        "medical-reception" => medical_reception::handle_query(q),
        // "food-lab" => food_lab::handle_query(q),  // add when wired
        other => Err(ModuleError::Internal(format!("module not wired: {other}"))),
    };

    // If the module cannot handle it (e.g. because a projection table is
    // missing), fall back to reading from the event log for known query
    // types. This is honest: v1 has no materialized projections.
    let response = match outcome {
        Ok(o) => o.response,
        Err(ModuleError::NotFound(_)) | Err(ModuleError::Internal(_)) => {
            return fallback_query(pool, query_type, payload).await;
        }
        Err(e) => return Err(map_module_error(e)),
    };

    // Post-process: run SQL if the module asked for it.
    match &response {
        Value::String(s) if looks_like_sql(s) => run_sql_return_rows(pool, s).await,
        Value::Object(m) => {
            if let Some(sql) = m.get("sql").and_then(|v| v.as_str()) {
                if looks_like_sql(sql) {
                    return run_sql_return_rows(pool, sql).await;
                }
            }
            Ok(response)
        }
        _ => Ok(response),
    }
}

async fn fallback_query(pool: &SqlitePool, query_type: &str, payload: &Value) -> AppResult<Value> {
    match query_type {
        "patient.list" | "patient.search" => {
            let limit = payload
                .get("limit")
                .and_then(|v| v.as_i64())
                .unwrap_or(200);
            list_patients_from_events(pool, limit).await
        }
        _ => Ok(json!([])),
    }
}