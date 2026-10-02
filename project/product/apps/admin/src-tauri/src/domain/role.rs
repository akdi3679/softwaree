use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub is_built_in: bool,
    pub created_at: DateTime<Utc>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub name: String,
    pub scope: Option<String>,
}

pub mod built_in {
    pub const ADMIN: &str = "admin";
    pub const DOCTOR: &str = "doctor";
    pub const RECEPTIONIST: &str = "receptionist";
    pub const LAB_TECH: &str = "lab_tech";

    pub const ALL: &[&str] = &[ADMIN, DOCTOR, RECEPTIONIST, LAB_TECH];

    pub fn default_permissions(role: &str) -> Vec<&'static str> {
        match role {
            ADMIN => vec!["project.manage", "users.manage", "modules.manage", "audit.read", "backup.manage", "*"],
            DOCTOR => vec!["patient.read", "patient.create", "patient.update", "patient.delete", "appointment.read", "appointment.create", "appointment.update", "appointment.delete"],
            RECEPTIONIST => vec!["patient.read", "patient.create", "patient.update", "appointment.read", "appointment.create", "appointment.update"],
            LAB_TECH => vec!["lab.sample.read", "lab.sample.create", "lab.sample.update", "lab.test.read", "lab.test.create", "lab.test.update", "lab.result.read", "lab.result.create"],
            _ => vec![],
        }
    }
}
