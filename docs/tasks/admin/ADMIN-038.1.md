# TASK ID: ADMIN-038.1
# TITLE: Add Admin: API client (programmatic access)
# STATUS: pending
# DEPENDENCIES: ARCH-014.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/api_client.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Admin can issue API calls (curl-like) from the UI.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/api_client.rs`:

```rust
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
    state: State<'_, AppState>,
    method: String,
    path: String,
    body: Option<String>,
) -> AppResult<ApiResponse> {
    // For v1: only allow calls to the local Admin's own endpoints.
    // Real API access (to Cloud) is via the device key.
    let url = format!("http://localhost:port{}", path);
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
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/api_client.rs || { echo "FAIL"; exit 1; }
grep -q "api_request" apps/admin/src-tauri/src/commands/api_client.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
