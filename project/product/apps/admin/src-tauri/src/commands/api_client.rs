use reqwest::Client;
use serde::Serialize;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: String,
}

#[tauri::command]
pub async fn api_request(
    _state: State<'_, AppState>,
    method: String,
    path: String,
    body: Option<String>,
) -> AppResult<ApiResponse> {
    let url = format!("http://localhost:{}", path);
    let client = Client::new();
    let req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err(crate::error::AppError::Validation(format!("invalid method: {method}"))),
    };
    let req = if let Some(b) = body { req.body(b).header("Content-Type", "application/json") } else { req };
    let resp = req.send().await.map_err(|e| crate::error::AppError::Network(e.to_string()))?;
    let status = resp.status().as_u16();
    let headers: Vec<_> = resp.headers().iter().map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string())).collect();
    let body = resp.text().await.map_err(|e| crate::error::AppError::Network(e.to_string()))?;
    Ok(ApiResponse { status, headers, body })
}
