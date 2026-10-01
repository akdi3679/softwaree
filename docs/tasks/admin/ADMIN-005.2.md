# TASK ID: ADMIN-005.2
# TITLE: Add domain layer for Role and Permission
# STATUS: pending
# DEPENDENCIES: ADMIN-005.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/domain/role.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the Rust domain for Role and Permission.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/domain/role.rs`:

```rust
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
    pub name: String,        // e.g., "patient.read"
    pub scope: Option<String>,
}

/// Built-in roles seeded on project creation.
pub mod built_in {
    pub const ADMIN: &str = "admin";
    pub const DOCTOR: &str = "doctor";
    pub const RECEPTIONIST: &str = "receptionist";
    pub const LAB_TECH: &str = "lab_tech";

    /// All built-in role names.
    pub const ALL: &[&str] = &[ADMIN, DOCTOR, RECEPTIONIST, LAB_TECH];

    /// Default permissions per built-in role.
    pub fn default_permissions(role: &str) -> Vec<&'static str> {
        match role {
            ADMIN => vec![
                "project.manage",
                "users.manage",
                "modules.manage",
                "audit.read",
                "backup.manage",
                // wildcard
                "*",
            ],
            DOCTOR => vec![
                "patient.read",
                "patient.create",
                "patient.update",
                "patient.delete",
                "appointment.read",
                "appointment.create",
                "appointment.update",
                "appointment.delete",
            ],
            RECEPTIONIST => vec![
                "patient.read",
                "patient.create",
                "patient.update",
                "appointment.read",
                "appointment.create",
                "appointment.update",
            ],
            LAB_TECH => vec![
                "lab.sample.read",
                "lab.sample.create",
                "lab.sample.update",
                "lab.test.read",
                "lab.test.create",
                "lab.test.update",
                "lab.result.read",
                "lab.result.create",
            ],
            _ => vec![],
        }
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/domain/role.rs || { echo "FAIL"; exit 1; }
grep -q "built_in" apps/admin/src-tauri/src/domain/role.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -3 || { echo "FAIL"; exit 1; }
echo "OK"
```
