use serde::Serialize;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct ProjectAnalytics {
    pub active_patients: i64,
    pub appointments_this_week: i64,
    pub samples_this_month: i64,
    pub storage_mb: i64,
    pub events_per_day: Vec<i64>,
    pub top_event_types: Vec<EventTypeCount>,
}

#[derive(Debug, Serialize)]
pub struct EventTypeCount {
    pub r#type: String,
    pub count: i64,
}

#[tauri::command]
pub async fn project_analytics(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<ProjectAnalytics> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };

    let active_patients: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT aggregate_id) FROM events WHERE aggregate_type = 'patient'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let appointments_this_week: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'appointment.created' AND occurred_at >= datetime('now', '-7 days')",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let samples_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'sample.intaken' AND occurred_at >= datetime('now', '-30 days')",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let storage_mb: i64 = handle
        .db_path
        .metadata()
        .map(|m| (m.len() / 1024 / 1024) as i64)
        .unwrap_or(0);

    let mut events_per_day: Vec<i64> = Vec::with_capacity(30);
    for d in (0..30).rev() {
        let row: Option<i64> = sqlx::query_scalar(
            "SELECT COUNT(*) FROM events WHERE occurred_at >= datetime('now', ?) AND occurred_at < datetime('now', ?)",
        )
        .bind(format!("-{} days", d + 1))
        .bind(format!("-{} days", d))
        .fetch_one(&handle.db)
        .await
        .ok();
        events_per_day.push(row.unwrap_or(0));
    }

    let top_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT event_type, COUNT(*) as n FROM events GROUP BY event_type ORDER BY n DESC LIMIT 10",
    )
    .fetch_all(&handle.db)
    .await
    .unwrap_or_default();

    let top_event_types: Vec<EventTypeCount> = top_rows
        .into_iter()
        .map(|(t, count)| EventTypeCount { r#type: t, count })
        .collect();

    Ok(ProjectAnalytics {
        active_patients,
        appointments_this_week,
        samples_this_month,
        storage_mb,
        events_per_day,
        top_event_types,
    })
}

#[derive(Debug, Serialize)]
pub struct MedicalKpis {
    pub patients_total: i64,
    pub patients_this_month: i64,
    pub visits_total: i64,
    pub visits_this_month: i64,
    pub avg_wait_minutes: f64,
    pub no_show_rate: f64,
    pub active_prescriptions: i64,
}

#[tauri::command]
pub async fn medical_kpis(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<MedicalKpis> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };

    let patients_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT aggregate_id) FROM events WHERE aggregate_type = 'patient'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let patients_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'patient.created' AND occurred_at >= datetime('now', '-30 days')",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let visits_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'visit.completed'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let visits_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'visit.completed' AND occurred_at >= datetime('now', '-30 days')",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let active_prescriptions: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'visit.prescribed'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    Ok(MedicalKpis {
        patients_total,
        patients_this_month,
        visits_total,
        visits_this_month,
        avg_wait_minutes: 0.0,
        no_show_rate: 0.0,
        active_prescriptions,
    })
}

#[derive(Debug, Serialize)]
pub struct FoodLabKpis {
    pub samples_total: i64,
    pub samples_this_month: i64,
    pub samples_in_progress: i64,
    pub samples_rejected: i64,
    pub avg_turnaround_hours: f64,
    pub reports_issued: i64,
    pub rejection_rate: f64,
}

#[tauri::command]
pub async fn foodlab_kpis(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<FoodLabKpis> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };

    let samples_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT aggregate_id) FROM events WHERE aggregate_type = 'sample'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let samples_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'sample.received' AND occurred_at >= datetime('now', '-30 days')",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let samples_rejected: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'sample.rejected'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let reports_issued: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE event_type = 'sample.report_issued'",
    )
    .fetch_one(&handle.db)
    .await
    .unwrap_or(0);

    let rejection_rate = if samples_total > 0 {
        samples_rejected as f64 / samples_total as f64
    } else {
        0.0
    };

    Ok(FoodLabKpis {
        samples_total,
        samples_this_month,
        samples_in_progress: 0,
        samples_rejected,
        avg_turnaround_hours: 0.0,
        reports_issued,
        rejection_rate,
    })
}
