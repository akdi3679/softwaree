use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;

use crate::helpers::parse;

#[derive(Debug, Deserialize)]
struct ListForDay {
    date: String,
}

#[derive(Debug, Deserialize)]
struct NextAvailable {
    after: String,
    duration_minutes: u32,
    within_days: u32,
}

#[derive(Debug, Deserialize)]
struct ListForPatient {
    patient_id: String,
    include_cancelled: Option<bool>,
}

fn is_valid_date(s: &str) -> bool {
    if s.len() != 10 { return false; }
    let parts: Vec<&str> = s.split('-').collect();
    parts.len() == 3
        && parts[0].len() == 4 && parts[0].parse::<u32>().is_ok()
        && parts[1].len() == 2 && parts[1].parse::<u32>().is_ok()
        && parts[2].len() == 2 && parts[2].parse::<u32>().is_ok()
}

pub fn handle_list_for_day(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForDay = parse(&q.payload)?;
    if !is_valid_date(&req.date) {
        return Err(ModuleError::Validation(format!("invalid date: {}", req.date)));
    }
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.list_for_day",
            "date": req.date,
            "sql": "SELECT * FROM projection_appointments WHERE scheduled_for LIKE ? ORDER BY scheduled_for ASC",
        }),
    })
}

pub fn handle_next_available(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: NextAvailable = parse(&q.payload)?;
    if req.duration_minutes == 0 {
        return Err(ModuleError::Validation("duration_minutes must be > 0".into()));
    }
    if req.within_days == 0 || req.within_days > 90 {
        return Err(ModuleError::Validation("within_days must be 1..=90".into()));
    }
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.next_available",
            "after": req.after,
            "duration_minutes": req.duration_minutes,
            "within_days": req.within_days,
            "sql": "recursive CTE on projection_appointments + projection_business_hours",
        }),
    })
}

pub fn handle_list_for_patient(q: &Query) -> ModuleResult<QueryOutcome> {
    let req: ListForPatient = parse(&q.payload)?;
    Ok(QueryOutcome {
        response: json!({
            "query_type": "appointment.list_for_patient",
            "patient_id": req.patient_id,
            "include_cancelled": req.include_cancelled.unwrap_or(false),
            "sql": "SELECT * FROM projection_appointments WHERE patient_id = ?",
        }),
    })
}
