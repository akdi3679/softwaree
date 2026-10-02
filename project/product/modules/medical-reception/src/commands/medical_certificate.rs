use printpdf::*;
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::{ModuleError, ModuleResult};
use serde::Deserialize;
use serde_json::json;
use std::fs::File;
use std::io::BufWriter;
use uuid::Uuid;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct IssueCertificate {
    patient_id: String,
    patient_name: String,
    visit_id: Option<String>,
    diagnosis: String,
    rest_days: u8,
    start_date: String,
    end_date: String,
    doctor_name: String,
    doctor_license: String,
    notes: Option<String>,
}

pub fn handle_issue(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: IssueCertificate = parse(&cmd.payload)?;
    if req.rest_days == 0 || req.rest_days > 90 {
        return Err(ModuleError::Validation("rest_days must be 1-90".into()));
    }
    let cert_id = new_id("cert");

    let output_path = std::env::temp_dir().join(format!("{cert_id}.pdf"));
    let output_path_str = output_path.to_string_lossy().to_string();

    let (doc, page1, layer1) =
        PdfDocument::new(&cert_id, Mm(210.0), Mm(297.0), "Layer 1");
    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| ModuleError::Internal(e.to_string()))?;
    let bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| ModuleError::Internal(e.to_string()))?;
    let mut layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("MEDICAL CERTIFICATE", 18.0, Mm(60.0), Mm(260.0), &bold);
    layer.use_text("Sick Leave", 14.0, Mm(80.0), Mm(248.0), &font);

    layer.use_text(&format!("Certificate #: {}", cert_id), 10.0, Mm(20.0), Mm(230.0), &font);
    layer.use_text(
        &format!("Patient: {} ({})", req.patient_name, req.patient_id),
        12.0,
        Mm(20.0),
        Mm(210.0),
        &bold,
    );
    layer.use_text(&format!("Diagnosis: {}", req.diagnosis), 11.0, Mm(20.0), Mm(195.0), &font);
    layer.use_text(&format!("Rest period: {} days", req.rest_days), 11.0, Mm(20.0), Mm(180.0), &font);
    layer.use_text(
        &format!("From {} to {}", req.start_date, req.end_date),
        11.0,
        Mm(20.0),
        Mm(165.0),
        &font,
    );
    if let Some(n) = &req.notes {
        layer.use_text(&format!("Notes: {}", n), 10.0, Mm(20.0), Mm(150.0), &font);
    }
    layer.use_text(&format!("Doctor: {}", req.doctor_name), 11.0, Mm(20.0), Mm(60.0), &font);
    layer.use_text(&format!("License #: {}", req.doctor_license), 11.0, Mm(20.0), Mm(50.0), &font);
    layer.use_text(
        &format!("Issued: {}", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")),
        10.0,
        Mm(20.0),
        Mm(40.0),
        &font,
    );

    let file = File::create(&output_path).map_err(|e| ModuleError::Internal(e.to_string()))?;
    doc.save(&mut BufWriter::new(file))
        .map_err(|e| ModuleError::Internal(e.to_string()))?;

    let event = evt("certificate.issued", "certificate", &cert_id, 1, json!({
        "certificate_id": cert_id,
        "patient_id": req.patient_id,
        "visit_id": req.visit_id,
        "diagnosis": req.diagnosis,
        "rest_days": req.rest_days,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "doctor_name": req.doctor_name,
        "doctor_license": req.doctor_license,
        "pdf_path": output_path_str,
    }));

    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "certificate_id": cert_id, "pdf_path": output_path_str }),
    })
}