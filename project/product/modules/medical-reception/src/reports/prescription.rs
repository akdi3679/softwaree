use printpdf::*;
use serde::Deserialize;
use std::fs::File;
use std::io::BufWriter;

#[derive(Debug, Deserialize)]
pub struct Prescription {
    pub patient_name: String,
    pub doctor_name: String,
    pub medication: String,
    pub dosage: String,
    pub frequency: String,
    pub duration_days: u32,
    pub notes: Option<String>,
    pub issued_at: String,
}

pub fn generate(rx: &Prescription, output_path: &str) -> Result<(), String> {
    let (doc, page1, layer1) = PdfDocument::new("Prescription", Mm(148.0), Mm(210.0), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;
    let bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;
    let layer = doc.get_page(page1).get_layer(layer1);

    layer.use_text("PRESCRIPTION", 18.0, Mm(15.0), Mm(190.0), &bold);
    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(184.0), &font);
    layer.use_text(&format!("Patient: {}", rx.patient_name), 11.0, Mm(15.0), Mm(175.0), &font);
    layer.use_text(&format!("Date: {}", rx.issued_at), 11.0, Mm(15.0), Mm(167.0), &font);
    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(160.0), &font);

    layer.use_text("Rx", 24.0, Mm(15.0), Mm(140.0), &bold);
    layer.use_text(&rx.medication, 13.0, Mm(15.0), Mm(125.0), &bold);
    layer.use_text(&format!("Dosage: {}", rx.dosage), 10.0, Mm(15.0), Mm(115.0), &font);
    layer.use_text(&format!("Frequency: {}", rx.frequency), 10.0, Mm(15.0), Mm(108.0), &font);
    layer.use_text(&format!("Duration: {} days", rx.duration_days), 10.0, Mm(15.0), Mm(101.0), &font);
    if let Some(notes) = &rx.notes {
        layer.use_text(&format!("Notes: {notes}"), 9.0, Mm(15.0), Mm(90.0), &font);
    }

    layer.use_text("--------------------------------------------------", 8.0, Mm(15.0), Mm(50.0), &font);
    layer.use_text(&format!("Dr. {}", rx.doctor_name), 10.0, Mm(15.0), Mm(40.0), &font);
    layer.use_text("____________________", 10.0, Mm(15.0), Mm(30.0), &font);
    layer.use_text("Signature", 8.0, Mm(15.0), Mm(22.0), &font);

    let file = File::create(output_path).map_err(|e| e.to_string())?;
    let mut buf = BufWriter::new(file);
    doc.save(&mut buf).map_err(|e| e.to_string())?;
    Ok(())
}
