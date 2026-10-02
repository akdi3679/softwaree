use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::modules::installer::{self, InstallContext, InstallPackage, InstallResult};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct InstalledModule {
    pub id: String,
    pub module_id: String,
    pub name: String,
    pub version: String,
    pub state: String,
    pub installed_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailableModule {
    pub module_id: String,
    pub name: String,
    pub latest_version: String,
    pub description: String,
}

#[tauri::command]
pub async fn list_installed_modules(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<Vec<InstalledModule>> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let rows: Vec<(String, String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, module_id, name, version, state, installed_at FROM module_registry",
    )
    .fetch_all(&handle.db)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| InstalledModule {
            id: r.0,
            module_id: r.1,
            name: r.2,
            version: r.3,
            state: r.4,
            installed_at: r.5,
        })
        .collect())
}

#[tauri::command]
pub async fn list_available_modules(
    _state: State<'_, AppState>,
    _project_id: String,
) -> AppResult<Vec<AvailableModule>> {
    // v1: fixed list, no Cloud round trip. Once the Cloud catalog is
    // populated for real, this hits GET /v1/marketplace/modules.
    Ok(vec![
        AvailableModule {
            module_id: "medical-reception".to_string(),
            name: "Medical Reception".to_string(),
            latest_version: "1.0.0".to_string(),
            description: "Doctor + N staff: patients, appointments, visits, prescriptions."
                .to_string(),
        },
        AvailableModule {
            module_id: "food-lab".to_string(),
            name: "Food Lab".to_string(),
            latest_version: "1.0.0".to_string(),
            description: "Sample -> test -> analysis -> result -> report.".to_string(),
        },
    ])
}

#[tauri::command]
pub async fn install_module(
    state: State<'_, AppState>,
    project_id: String,
    module_id: String,
    version: String,
) -> AppResult<InstallResult> {
    // Fetch the manifest + binary + signatures from the Cloud.
    //
    // Endpoint (from 00-OVERVIEW.md): GET /v1/modules/{id}/versions/{v}/package
    // Response shape: { manifest, binary, signatures, packagingFormatVersion }
    let url = format!(
        "{}/v1/modules/{}/versions/{}/package?projectId={}",
        state.cloud_base_url, module_id, version, project_id
    );
    let token = state.cloud_token.lock().await.clone();
    let mut req = state.http_client.get(&url);
    if !token.is_empty() {
        req = req.bearer_auth(&token);
    }
    let resp = req
        .send()
        .await
        .map_err(|e| AppError::Network(format!("cloud fetch: {e}")))?;
    if !resp.status().is_success() {
        return Err(AppError::Network(format!(
            "cloud returned {} for module package",
            resp.status()
        )));
    }
    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Network(format!("cloud json: {e}")))?;

    // Parse the Cloud response into an InstallPackage.
    let manifest: crate::modules::manifest::ModuleManifest = serde_json::from_value(
        body.get("manifest")
            .cloned()
            .ok_or_else(|| AppError::Network("missing manifest in package".into()))?,
    )
    .map_err(|e| AppError::Json(format!("manifest parse: {e}")))?;

    let binary_b64 = body
        .get("binary")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Network("missing binary in package".into()))?
        .to_string();

    let signatures: crate::modules::verify::ModuleSignature = serde_json::from_value(
        body.get("signatures")
            .cloned()
            .ok_or_else(|| AppError::Network("missing signatures in package".into()))?,
    )
    .map_err(|e| AppError::Json(format!("signatures parse: {e}")))?;

    let package = InstallPackage {
        manifest,
        binary_b64,
        signatures,
    };

    // Open project handle + plan + device identity
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        AppError::NotFound(format!("project {project_id} not open"))
    })?;

    let plan_id = state.plan_for_project(&project_id).await.unwrap_or_else(|_| "local".to_string());
    let device_id = state.device_id();
    // The device-bind key is derived from the device's identity. For v1 we
    // use the device's Ed25519 signing key as the HMAC key. See the
    // follow-up note in HANDOFF.md.
    let device_key = state.load_device_key().await?;

    let ctx = InstallContext {
        pool: &handle.db,
        modules_dir: &state.paths.modules_dir,
        project_id: &project_id,
        plan_id: &plan_id,
        device_id: &device_id,
        device_bind_key: &device_key,
    };

    installer::install(ctx, package).await
}