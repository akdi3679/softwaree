use printpdf::*;
use serde_json::Value;
use std::fs::File;
use std::io::BufWriter;

pub struct LabReport {
    pub sample_id: String,
    pub client_name: String,
    pub sample_type: String,
    pub collected_at: String,
    pub test_type: String,
    pub measurements: Value,
    pub passed: bool,
    pub issued_at: String,
}

pub fn generate_lab_report(report: &LabReport, output_path: &str) -> Result<(), String> {
    let title = format!("Lab Report {}", report.sample_id);
    let (doc, page1, layer1) =
        PdfDocument::new(&title, Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;
    let bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| e.to_string())?;
    let mut layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("LABORATORY CERTIFICATE", 24.0, Mm(20.0), Mm(270.0), &bold);
    layer.use_text(&format!("Sample: {}", report.sample_id), 12.0, Mm(20.0), Mm(255.0), &font);
    layer.use_text(&format!("Client: {}", report.client_name), 12.0, Mm(20.0), Mm(247.0), &font);
    layer.use_text(&format!("Type: {}", report.sample_type), 12.0, Mm(20.0), Mm(239.0), &font);
    layer.use_text(&format!("Collected: {}", report.collected_at), 12.0, Mm(20.0), Mm(231.0), &font);
    layer.use_text(&format!("Test: {}", report.test_type), 12.0, Mm(20.0), Mm(223.0), &font);
    layer.use_text(&format!("Issued: {}", report.issued_at), 12.0, Mm(20.0), Mm(215.0), &font);

    let result = if report.passed { "PASS" } else { "FAIL" };
    layer.use_text(&format!("RESULT: {}", result), 16.0, Mm(20.0), Mm(190.0), &bold);

    layer.use_text("Measurements:", 14.0, Mm(20.0), Mm(170.0), &bold);
    let mut y = 160.0;
    if let Some(obj) = report.measurements.as_object() {
        for (k, v) in obj {
            layer.use_text(&format!("  {}: {}", k, v), 11.0, Mm(20.0), Mm(y), &font);
            y -= 7.0;
        }
    }

    layer.use_text("Lab Technician: ____________________", 11.0, Mm(20.0), Mm(50.0), &font);
    layer.use_text("Date: ____________________", 11.0, Mm(20.0), Mm(40.0), &font);

    let file = File::create(output_path).map_err(|e| e.to_string())?;
    let mut buf = BufWriter::new(file);
    doc.save(&mut buf).map_err(|e| e.to_string())?;
    Ok(())
}