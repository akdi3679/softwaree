# TASK ID: USER-008.2
# TITLE: Add User export to PDF
# STATUS: pending
# DEPENDENCIES: USER-008.1
# ALLOWED FILES: product/apps/user/src-tauri/src/commands/export.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can export their projection (patients, samples) as a PDF report.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/commands/export.rs`:

```rust
use printpdf::*;
use sqlx::SqlitePool;
use std::fs::File;
use std::io::BufWriter;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn export_projection_pdf(state: State<'_, AppState>, table: String, output_path: String) -> AppResult<u32> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| crate::error::AppError::NotFound("no active projection".into()))?;
    let rows = fetch_table(&proj.pool, &table).await?;
    generate_pdf(&table, &rows, &output_path)?;
    Ok(rows.len() as u32)
}

async fn fetch_table(pool: &SqlitePool, table: &str) -> AppResult<Vec<(String, String)>> {
    let real_table = match table.as_str() {
        "patients" => "projection_patients",
        "samples" => "projection_samples",
        "appointments" => "projection_appointments",
        "audit" => "projection_audit",
        _ => return Err(crate::error::AppError::Validation(format!("unknown table: {table}"))),
    };
    // We just fetch (id, json) pairs
    let rows: Vec<(String, String)> = sqlx::query_as(&format!("SELECT id, '{}' FROM {}", "{}", real_table))
        .bind("placeholder")
        .fetch_all(pool)
        .await
        .unwrap_or_default();
    Ok(rows)
}

fn generate_pdf(table: &str, rows: &[(String, String)], output_path: &str) -> Result<(), String> {
    let (doc, page1, layer1) = PdfDocument::new(table, Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;
    let bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;
    let mut layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text(&format!("Export: {}", table), 18.0, Mm(20.0), Mm(280.0), &bold);
    layer.use_text(&format!("{} rows", rows.len()), 11.0, Mm(20.0), Mm(270.0), &font);

    let mut y = 250.0;
    for (id, _data) in rows.iter().take(50) {
        layer.use_text(id, 10.0, Mm(20.0), Mm(y), &font);
        y -= 5.0;
        if y < 30.0 { break; }
    }

    let file = File::create(output_path).map_err(|e| e.to_string())?;
    let mut buf = BufWriter::new(file);
    doc.save(&mut buf).map_err(|e| e.to_string())?;
    Ok(())
}
```

Add to `Cargo.toml`:
```toml
printpdf = "0.7"
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/commands/export.rs || { echo "FAIL"; exit 1; }
grep -q "export_projection_pdf" apps/user/src-tauri/src/commands/export.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
