use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::ModuleResult;
use serde::Deserialize;
use serde_json::json;

use crate::helpers::{evt, new_id, parse};

#[derive(Debug, Deserialize)]
struct GenerateReportCard {
    student_id: String,
    term: String,
    comments: Option<String>,
}

pub fn handle_generate(cmd: &Command) -> ModuleResult<CommandOutcome> {
    let req: GenerateReportCard = parse(&cmd.payload)?;
    let report_card_id = new_id("rc");
    let event = evt(
        "report_card.generated",
        "report_card",
        &report_card_id,
        1,
        json!({
            "report_card_id": report_card_id,
            "student_id": req.student_id,
            "term": req.term,
            "comments": req.comments,
            "generated_at": chrono::Utc::now().to_rfc3339(),
        }),
    );
    Ok(CommandOutcome {
        events: vec![event],
        response: json!({ "report_card_id": report_card_id }),
    })
}
