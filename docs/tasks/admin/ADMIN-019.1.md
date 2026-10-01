# TASK ID: ADMIN-019.1
# TITLE: Add Admin: batch import from CSV (medical patients)
# STATUS: pending
# DEPENDENCIES: MODULE-006.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/csv_import.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Import patients from a CSV.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
csv = "1"
```

Create `product/apps/admin/src-tauri/src/commands/csv_import.rs`:

```rust
use csv::ReaderBuilder;
use serde::Deserialize;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Deserialize)]
struct PatientRow {
    full_name: String,
    phone: String,
    email: Option<String>,
    date_of_birth: String,
    gender: String,    // "male" | "female" | "other"
}

#[tauri::command]
pub async fn import_patients_csv(
    state: State<'_, AppState>,
    project_id: String,
    file_path: String,
) -> AppResult<u32> {
    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .from_path(&file_path)
        .map_err(|e| crate::error::AppError::Validation(e.to_string()))?;
    let mut count = 0u32;
    for result in rdr.deserialize::<PatientRow>() {
        let row = result.map_err(|e| crate::error::AppError::Validation(e.to_string()))?;
        if !["male", "female", "other"].contains(&row.gender.as_str()) {
            return Err(crate::error::AppError::Validation(format!("invalid gender in row {}: {}", count + 1, row.gender)));
        }
        let handle = state.projects.read().await.get(&project_id).cloned()
            .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
        crate::commands::handlers::create_patient(&handle.db, "usr_admin", "dev_1",
            crate::commands::handlers::CreatePatientRequest {
                full_name: row.full_name,
                phone: row.phone,
                email: row.email,
                date_of_birth: row.date_of_birth,
                gender: row.gender,
            }).await?;
        count += 1;
    }
    Ok(count)
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/csv_import.rs || { echo "FAIL"; exit 1; }
grep -q "import_patients_csv" apps/admin/src-tauri/src/commands/csv_import.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
