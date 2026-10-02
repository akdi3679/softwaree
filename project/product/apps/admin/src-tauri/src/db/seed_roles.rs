use sqlx::SqlitePool;
use crate::domain::role::built_in;
use crate::error::AppResult;
use chrono::Utc;
use uuid::Uuid;

pub async fn seed_roles(pool: &SqlitePool) -> AppResult<()> {
    for name in built_in::ALL {
        let id = Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO roles (id, name, display_name, is_built_in, created_at)
            VALUES (?, ?, ?, 1, ?)
            "#,
        )
        .bind(&id)
        .bind(name)
        .bind(display_name_for(name))
        .bind(Utc::now().to_rfc3339())
        .execute(pool)
        .await?;

        let role_id: String = sqlx::query_scalar("SELECT id FROM roles WHERE name = ?")
            .bind(name)
            .fetch_one(pool)
            .await?;
        for perm in built_in::default_permissions(name) {
            sqlx::query(
                r#"
                INSERT OR IGNORE INTO role_permissions (role_id, permission, granted_at)
                VALUES (?, ?, ?)
                "#,
            )
            .bind(&role_id)
            .bind(perm)
            .bind(Utc::now().to_rfc3339())
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

fn display_name_for(role: &str) -> &'static str {
    match role {
        built_in::ADMIN => "Administrator",
        built_in::DOCTOR => "Doctor",
        built_in::RECEPTIONIST => "Receptionist",
        built_in::LAB_TECH => "Lab Technician",
        _ => "Unknown",
    }
}
