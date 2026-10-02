use std::fs::File;
use std::io::BufWriter;

use printpdf::*;
use serde_json::Value;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

/// Generate a lab report PDF from a JSON payload.
///
/// Returns the absolute path of the written PDF. The UI uses `@tauri-apps/
/// plugin-fs` to read it back or hand it to the OS print dialog.
///
/// V1.0: this is a local-only generator — it does not require the
/// food-lab WASM module to be loaded. The module-owned reports/pdf.rs
/// remains a Category C item (see HANDOFF.md).
#[tauri::command]
pub async fn generate_lab_report(
    state: State<'_, AppState>,
    payload: Value,
) -> AppResult<String> {
    let sample_id = payload.get("sample_id").and_then(|v| v.as_str()).unwrap_or("unknown");
    let client_name = payload.get("client_name").and_then(|v| v.as_str()).unwrap_or("");
    let sample_type = payload.get("sample_type").and_then(|v| v.as_str()).unwrap_or("");
    let collected_at = payload.get("collected_at").and_then(|v| v.as_str()).unwrap_or("");
    let test_type = payload.get("test_type").and_then(|v| v.as_str()).unwrap_or("");
    let passed = payload.get("passed").and_then(|v| v.as_bool()).unwrap_or(false);
    let issued_at = payload.get("issued_at").and_then(|v| v.as_str()).unwrap_or("");
    let measurements = payload.get("measurements").cloned().unwrap_or(Value::Object(Default::default()));

    let out_dir = state.paths.data_dir.join("reports");
    std::fs::create_dir_all(&out_dir)?;
    let out_path = out_dir.join(format!("lab-report-{sample_id}.pdf"));

    let title = format!("Lab Report {sample_id}");
    let (doc, page1, layer1) = PdfDocument::new(&title, Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| AppError::Internal(e.to_string()))?;
    let bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| AppError::Internal(e.to_string()))?;
    let layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("LABORATORY CERTIFICATE", 24.0, Mm(20.0), Mm(270.0), &bold);
    layer.use_text(&format!("Sample: {sample_id}"), 12.0, Mm(20.0), Mm(255.0), &font);
    layer.use_text(&format!("Client: {client_name}"), 12.0, Mm(20.0), Mm(247.0), &font);
    layer.use_text(&format!("Type: {sample_type}"), 12.0, Mm(20.0), Mm(239.0), &font);
    layer.use_text(&format!("Collected: {collected_at}"), 12.0, Mm(20.0), Mm(231.0), &font);
    layer.use_text(&format!("Test: {test_type}"), 12.0, Mm(20.0), Mm(223.0), &font);
    layer.use_text(&format!("Issued: {issued_at}"), 12.0, Mm(20.0), Mm(215.0), &font);

    let result = if passed { "PASS" } else { "FAIL" };
    layer.use_text(&format!("RESULT: {result}"), 16.0, Mm(20.0), Mm(190.0), &bold);

    layer.use_text("Measurements:", 14.0, Mm(20.0), Mm(170.0), &bold);
    let mut y = 160.0_f32;
    if let Some(obj) = measurements.as_object() {
        for (k, v) in obj {
            layer.use_text(&format!("  {k}: {v}"), 11.0, Mm(20.0), Mm(y), &font);
            y -= 7.0;
        }
    }

    layer.use_text("Lab Technician: ____________________", 11.0, Mm(20.0), Mm(50.0), &font);
    layer.use_text("Date: ____________________", 11.0, Mm(20.0), Mm(40.0), &font);

    let file = File::create(&out_path)?;
    let mut buf = BufWriter::new(file);
    doc.save(&mut buf).map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(out_path.to_string_lossy().to_string())
}

/// Generate a prescription PDF from a JSON payload.
#[tauri::command]
pub async fn generate_prescription(
    state: State<'_, AppState>,
    payload: Value,
) -> AppResult<String> {
    let patient_id = payload.get("patient_id").and_then(|v| v.as_str()).unwrap_or("unknown");
    let patient_name = payload.get("patient_name").and_then(|v| v.as_str()).unwrap_or("");
    let issued_at = payload.get("issued_at").and_then(|v| v.as_str()).unwrap_or("");
    let doctor_name = payload.get("doctor_name").and_then(|v| v.as_str()).unwrap_or("");
    let medication = payload.get("medication").and_then(|v| v.as_str()).unwrap_or("");
    let dosage = payload.get("dosage").and_then(|v| v.as_str()).unwrap_or("");
    let frequency = payload.get("frequency").and_then(|v| v.as_str()).unwrap_or("");
    let duration_days = payload.get("duration_days").and_then(|v| v.as_i64()).unwrap_or(0);
    let notes = payload.get("notes").and_then(|v| v.as_str()).unwrap_or("");

    let out_dir = state.paths.data_dir.join("reports");
    std::fs::create_dir_all(&out_dir)?;
    let out_path = out_dir.join(format!("prescription-{patient_id}.pdf"));

    let (doc, page1, layer1) = PdfDocument::new("Prescription", Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| AppError::Internal(e.to_string()))?;
    let bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| AppError::Internal(e.to_string()))?;
    let layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("PRESCRIPTION", 18.0, Mm(15.0), Mm(190.0), &bold);
    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(184.0), &font);
    layer.use_text(&format!("Patient: {patient_name}"), 11.0, Mm(15.0), Mm(175.0), &font);
    layer.use_text(&format!("Date: {issued_at}"), 11.0, Mm(15.0), Mm(167.0), &font);
    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(160.0), &font);

    layer.use_text("Rx", 24.0, Mm(15.0), Mm(140.0), &bold);
    layer.use_text(medication, 13.0, Mm(15.0), Mm(125.0), &bold);
    layer.use_text(&format!("Dosage: {dosage}"), 10.0, Mm(15.0), Mm(115.0), &font);
    layer.use_text(&format!("Frequency: {frequency}"), 10.0, Mm(15.0), Mm(108.0), &font);
    layer.use_text(&format!("Duration: {duration_days} days"), 10.0, Mm(15.0), Mm(101.0), &font);
    if !notes.is_empty() {
        layer.use_text(&format!("Notes: {notes}"), 9.0, Mm(15.0), Mm(90.0), &font);
    }

    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(50.0), &font);
    layer.use_text(&format!("Dr. {doctor_name}"), 10.0, Mm(15.0), Mm(40.0), &font);
    layer.use_text("____________________", 10.0, Mm(15.0), Mm(30.0), &font);
    layer.use_text("Signature", 8.0, Mm(15.0), Mm(22.0), &font);

    let file = File::create(&out_path)?;
    let mut buf = BufWriter::new(file);
    doc.save(&mut buf).map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(out_path.to_string_lossy().to_string())
}