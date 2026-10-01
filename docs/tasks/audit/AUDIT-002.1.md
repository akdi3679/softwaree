# TASK ID: AUDIT-002.1
# TITLE: Add Admin audit export (CSV / JSON)
# STATUS: pending
# DEPENDENCIES: OBS-003.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/audit/export.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Export the audit log as CSV or JSON, signed by the Admin.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/audit/export.rs`:

```rust
use chrono::Utc;
use ed25519_dalek::Signer;
use serde::Serialize;
use sqlx::SqlitePool;
use std::path::Path;
use tokio::fs;
use crate::error::AppResult;

#[derive(Debug, Serialize)]
struct AuditExportEntry {
    id: i64,
    occurred_at: String,
    actor_user_id: Option<String>,
    actor_device_id: Option<String>,
    action: String,
    target_type: Option<String>,
    target_id: Option<String>,
    result: String,
    details: Option<String>,
    entry_hash: String,
}

pub async fn export_csv(pool: &SqlitePool, output_path: &Path) -> AppResult<u64> {
    let rows = export_entries(pool).await?;
    let mut csv = String::new();
    csv.push_str("id,occurred_at,actor_user_id,actor_device_id,action,target_type,target_id,result,details,entry_hash\n");
    for r in &rows {
        let details = r.details.clone().unwrap_or_default().replace('"', "\"\"");
        let line = format!("{},{},{},{},{},{},{},{},\"{}\",{}\n",
            r.id, r.occurred_at,
            r.actor_user_id.as_deref().unwrap_or(""),
            r.actor_device_id.as_deref().unwrap_or(""),
            r.action,
            r.target_type.as_deref().unwrap_or(""),
            r.target_id.as_deref().unwrap_or(""),
            r.result,
            details,
            r.entry_hash,
        );
        csv.push_str(&line);
    }
    fs::write(output_path, &csv).await?;
    Ok(rows.len() as u64)
}

pub async fn export_json(pool: &SqlitePool, output_path: &Path, signing_key: &ed25519_dalek::SigningKey) -> AppResult<String> {
    let rows = export_entries(pool).await?;
    let json = serde_json::to_string_pretty(&rows)?;
    let signature = signing_key.sign(json.as_bytes());
    let sig_b64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, signature.to_bytes());
    let envelope = serde_json::json!({
        "exported_at": Utc::now().to_rfc3339(),
        "device_id": hex::encode(signing_key.verifying_key().to_bytes()),
        "signature": sig_b64,
        "data": serde_json::Value::Array(rows.iter().map(|r| serde_json::to_value(r).unwrap()).collect()),
    });
    let envelope_str = serde_json::to_string_pretty(&envelope)?;
    fs::write(output_path, &envelope_str).await?;
    Ok(sig_b64)
}

async fn export_entries(pool: &SqlitePool) -> AppResult<Vec<AuditExportEntry>> {
    let rows: Vec<(i64, String, Option<String>, Option<String>, String, Option<String>, Option<String>, String, Option<String>, String)> = sqlx::query_as(
        "SELECT id, occurred_at, actor_user_id, actor_device_id, action, target_type, target_id, result, details, entry_hash FROM audit_entries ORDER BY id ASC"
    ).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|r| AuditExportEntry {
        id: r.0, occurred_at: r.1, actor_user_id: r.2, actor_device_id: r.3, action: r.4, target_type: r.5, target_id: r.6, result: r.7, details: r.8, entry_hash: r.9,
    }).collect())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/audit/export.rs || { echo "FAIL"; exit 1; }
grep -q "export_csv" apps/admin/src-tauri/src/audit/export.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
