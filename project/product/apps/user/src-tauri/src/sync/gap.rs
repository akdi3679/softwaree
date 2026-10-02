use crate::db::projection_db::ProjectionDb;
use crate::error::AppResult;

const GAP_THRESHOLD: i64 = 5_000;
const SNAPSHOT_AGE_DAYS: i64 = 7;

pub async fn needs_snapshot(db: &ProjectionDb, first_sequence: i64) -> AppResult<bool> {
    let local = db.get_position().await?;
    let gap = first_sequence - local;
    if gap > GAP_THRESHOLD { return Ok(true); }
    let snap_at: Option<(Option<String>,)> = sqlx::query_as("SELECT snapshot_at FROM projection_state WHERE project_id = ?")
        .bind(&db.project_id).fetch_optional(&db.pool).await?;
    if let Some((Some(s),)) = snap_at {
        if let Ok(t) = chrono::DateTime::parse_from_rfc3339(&s) {
            let days = (chrono::Utc::now() - t.with_timezone(&chrono::Utc)).num_days();
            if days > SNAPSHOT_AGE_DAYS { return Ok(true); }
        }
    }
    Ok(false)
}
