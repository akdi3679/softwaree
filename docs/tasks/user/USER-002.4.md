# TASK ID: USER-002.4
# TITLE: Add User auth and sync commands
# STATUS: pending
# DEPENDENCIES: USER-002.3
# ALLOWED FILES: product/apps/user/src-tauri/src/commands/auth.rs, product/apps/user/src-tauri/src/commands/sync.rs, product/apps/user/src-tauri/src/commands/data.rs, product/apps/user/src-tauri/src/commands/ping.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Wire up login, sync, and data query Tauri commands.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/commands/ping.rs`:

```rust
use crate::error::AppResult;

#[tauri::command]
pub async fn ping() -> AppResult<String> {
    Ok("pong".to_string())
}
```

Create `product/apps/user/src-tauri/src/commands/auth.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct UserLogin {
    pub user_id: String,
    pub display_name: String,
    pub session_token: String,
}

#[tauri::command]
pub async fn login_user(
    state: State<'_, AppState>,
    user_id: String,
    display_name: String,
) -> AppResult<UserLogin> {
    // v1: trust the local user. Real impl: verify with Cloud.
    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    Ok(UserLogin {
        user_id,
        display_name,
        session_token: B64.encode(token_bytes),
    })
}

#[tauri::command]
pub async fn logout_user(
    _state: State<'_, AppState>,
    _session_token: String,
) -> AppResult<()> {
    Ok(())
}
```

Create `product/apps/user/src-tauri/src/commands/sync.rs`:

```rust
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use crate::sync::client::{AdminEndpoint, SyncClient};

#[tauri::command]
pub async fn connect_to_admin(
    state: State<'_, AppState>,
    host: String,
    port: u16,
    user_id: String,
    project_id: String,
    auth_token: String,
) -> AppResult<String> {
    let endpoint = AdminEndpoint { host, port };
    let (client, session_id) = SyncClient::connect(
        &endpoint,
        &user_id,
        &state.device.key,
        &project_id,
        &auth_token,
    ).await?;
    *state.sync.write().await = Some(client);
    Ok(session_id)
}

#[tauri::command]
pub async fn disconnect_from_admin(state: State<'_, AppState>) -> AppResult<()> {
    *state.sync.write().await = None;
    Ok(())
}

#[tauri::command]
pub async fn sync_now(state: State<'_, AppState>) -> AppResult<i64> {
    let client = state.sync.read().await;
    let client = client.as_ref().ok_or_else(|| AppError::NotFound("not connected".into()))?;
    let position = {
        let proj = state.active_projection.read().await;
        match proj.as_ref() {
            Some(p) => p.get_position().await?,
            None => 0,
        }
    };
    client.ack(position).await?;
    Ok(position)
}
```

Create `product/apps/user/src-tauri/src/commands/data.rs`:

```rust
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn list_projection(state: State<'_, AppState>, table: String) -> AppResult<serde_json::Value> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| crate::error::AppError::NotFound("no active projection".into()))?;
    let rows = match table.as_str() {
        "users" => {
            sqlx::query_as::<_, (String, String, String, String)>(
                "SELECT id, email, display_name, state FROM projection_users WHERE state != 'removed'"
            )
            .fetch_all(&proj.pool)
            .await?
            .into_iter()
            .map(|(id, email, display_name, state)| serde_json::json!({
                "id": id, "email": email, "display_name": display_name, "state": state
            }))
            .collect()
        }
        "audit" => {
            sqlx::query_as::<_, (i64, String, Option<String>, String, String)>(
                "SELECT id, occurred_at, actor_user_id, action, result FROM projection_audit ORDER BY id DESC LIMIT 100"
            )
            .fetch_all(&proj.pool)
            .await?
            .into_iter()
            .map(|(id, occurred_at, actor_user_id, action, result)| serde_json::json!({
                "id": id, "occurred_at": occurred_at, "actor_user_id": actor_user_id, "action": action, "result": result
            }))
            .collect()
        }
        _ => return Err(crate::error::AppError::Validation(format!("unknown table: {table}"))),
    };
    Ok(serde_json::json!({ "rows": rows }))
}

#[tauri::command]
pub async fn query_event_log(state: State<'_, AppState>, from_sequence: i64, limit: i64) -> AppResult<serde_json::Value> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| crate::error::AppError::NotFound("no active projection".into()))?;
    let rows = sqlx::query_as::<_, (i64, String, String, String, String, String, String)>(
        r#"
        SELECT sequence, event_type, aggregate_type, aggregate_id, occurred_at, actor_user_id, payload
        FROM projection_events
        WHERE sequence > ?
        ORDER BY sequence ASC
        LIMIT ?
        "#,
    )
    .bind(from_sequence)
    .bind(limit)
    .fetch_all(&proj.pool)
    .await?;
    let events: Vec<serde_json::Value> = rows.into_iter().map(|(seq, etype, atype, aid, time, actor, payload)| {
        serde_json::json!({
            "sequence": seq, "event_type": etype, "aggregate_type": atype,
            "aggregate_id": aid, "occurred_at": time, "actor_user_id": actor, "payload": payload
        })
    }).collect();
    Ok(serde_json::json!({ "events": events }))
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/commands/auth.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/commands/sync.rs || { echo "FAIL: no sync"; exit 1; }
test -f apps/user/src-tauri/src/commands/data.rs || { echo "FAIL: no data"; exit 1; }
test -f apps/user/src-tauri/src/commands/ping.rs || { echo "FAIL: no ping"; exit 1; }
echo "OK"
```
