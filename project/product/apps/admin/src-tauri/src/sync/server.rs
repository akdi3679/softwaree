//! Admin-side sync server: WebSocket transport, one JSON message per frame.
//!
//! Lifecycle:
//!   1. Bind a TCP listener.
//!   2. For each connection, upgrade to WebSocket, spawn a handler task.
//!   3. Handler loop: read a `ClientMessage`, dispatch, write a
//!      `ServerMessage` (or a stream of them for SyncRequest).
//!
//! Dispatch table:
//!   Hello        -> verify protocol version, register the user,
//!                   reply Welcome { session_id }.
//!   Heartbeat    -> update last_user_heartbeat, reply HeartbeatAck.
//!   SyncRequest  -> read events from the project's event store from
//!                   `last_sequence + 1` up to `max_events`, reply
//!                   SyncResponse.
//!   Ack          -> record the user's cursor, no reply.
//!
//! The four-step command handshake (CommandRequest / AckGotten /
//! ApplyRequest / Applied) is a later addition (C3).

use std::net::SocketAddr;
use std::sync::Arc;

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;

use crate::state::AppState;
use crate::sync::hello_verify::verify_hello_signature;
use crate::sync::protocol::{ClientMessage, ServerMessage, DEFAULT_MAX_EVENTS, PROTOCOL_VERSION};
use std::collections::HashMap;

pub async fn start(state: Arc<AppState>, addr: SocketAddr) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    tracing::info!(%addr, "sync server listening (websocket)");
    loop {
        let (stream, peer) = listener.accept().await?;
        let state = state.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_connection(state, stream, peer).await {
                tracing::warn!(?peer, error = %e, "sync connection ended");
            }
        });
    }
}

async fn handle_connection(
    state: Arc<AppState>,
    stream: TcpStream,
    peer: SocketAddr,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ws = tokio_tungstenite::accept_async(stream).await?;
    let (mut write, mut read) = ws.split();

    // Session state for this connection. Populated by the Hello frame.
    let mut session: Option<SessionInfo> = None;
    let mut pending: HashMap<String, PendingCommand> = HashMap::new();

    while let Some(msg) = read.next().await {
        let msg = msg?;
        let text = match msg {
            Message::Text(t) => t,
            Message::Binary(b) => String::from_utf8(b.to_vec())?,
            Message::Close(_) => break,
            Message::Ping(_) | Message::Pong(_) | Message::Frame(_) => continue,
        };

        let parsed: ClientMessage = match serde_json::from_str(&text) {
            Ok(m) => m,
            Err(e) => {
                let reply = ServerMessage::Error {
                    message: format!("invalid frame: {e}"),
                };
                write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                continue;
            }
        };

        match parsed {
            ClientMessage::Hello {
                protocol_version,
                user_id,
                device_id,
                project_id,
                device_pubkey,
                device_signature,
            } => {
                if protocol_version != PROTOCOL_VERSION {
                    let reply = ServerMessage::Error {
                        message: format!(
                            "unsupported protocol version {protocol_version}, expected {PROTOCOL_VERSION}"
                        ),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                }
                // Verify the hello signature against the device's public key.
                // The signature covers (protocol_version, user_id, project_id).
                if let Err(e) = verify_hello_signature(
                    &device_pubkey,
                    &device_signature,
                    protocol_version,
                    &user_id,
                    &project_id,
                ) {
                    tracing::warn!(
                        target: "sync",
                        %peer,
                        error = %e,
                        "rejecting hello: signature verification failed"
                    );
                    let reply = ServerMessage::Error {
                        message: "hello signature invalid".to_string(),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                }
                let session_id = uuid::Uuid::new_v4().to_string();
                // Register the user in SyncState so the mesh health code
                // and the Admin UI can see them.
                {
                    let mut sync = state.sync.write().await;
                    if !sync.connected_users.contains(&user_id) {
                        sync.connected_users.push(user_id.clone());
                    }
                    sync.last_user_heartbeat
                        .insert(user_id.clone(), chrono::Utc::now());
                }
                tracing::info!(
                    target: "sync",
                    %peer,
                    %user_id,
                    %device_id,
                    %project_id,
                    device_pubkey_prefix = %&device_pubkey[..device_pubkey.len().min(16)],
                    "client registered"
                );
                session = Some(SessionInfo {
                    session_id: session_id.clone(),
                    user_id,
                    device_id,
                    project_id,
                });
                let reply = ServerMessage::Welcome { session_id };
                write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
            }

            ClientMessage::Heartbeat => {
                let Some(ref s) = session else {
                    let reply = ServerMessage::Error {
                        message: "heartbeat before hello".to_string(),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };
                {
                    let mut sync = state.sync.write().await;
                    sync.last_user_heartbeat
                        .insert(s.user_id.clone(), chrono::Utc::now());
                }
                let reply = ServerMessage::HeartbeatAck;
                write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
            }

            ClientMessage::SyncRequest {
                last_sequence,
                max_events,
            } => {
                let Some(ref s) = session else {
                    let reply = ServerMessage::Error {
                        message: "sync request before hello".to_string(),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };
                let limit = max_events.unwrap_or(DEFAULT_MAX_EVENTS).clamp(1, 5000);

                // Look up the project's DB handle.
                let handle = {
                    let projects = state.projects.read().await;
                    projects.get(&s.project_id).cloned()
                };
                let Some(handle) = handle else {
                    let reply = ServerMessage::Error {
                        message: format!("project {} not open on this Admin", s.project_id),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };

                // Read events strictly after `last_sequence`.
                let rows: Vec<(i64, String, String, String, String)> = sqlx::query_as(
                    "SELECT sequence, event_type, aggregate_type, aggregate_id, payload \
                     FROM events WHERE sequence > ? ORDER BY sequence ASC LIMIT ?",
                )
                .bind(last_sequence)
                .bind(limit)
                .fetch_all(&handle.db)
                .await
                .unwrap_or_default();

                let from_sequence = last_sequence + 1;
                let to_sequence = rows.last().map(|r| r.0).unwrap_or(last_sequence);
                let events: Vec<serde_json::Value> = rows
                    .into_iter()
                    .map(|(seq, etype, atype, aid, payload)| {
                        let parsed_payload: serde_json::Value =
                            serde_json::from_str(&payload).unwrap_or(serde_json::Value::Null);
                        serde_json::json!({
                            "sequence": seq,
                            "event_type": etype,
                            "aggregate_type": atype,
                            "aggregate_id": aid,
                            "payload": parsed_payload,
                        })
                    })
                    .collect();

                let reply = ServerMessage::SyncResponse {
                    mode: "incremental".to_string(),
                    from_sequence,
                    to_sequence,
                    events: Some(events),
                    snapshot: None,
                    has_more: Some(false),
                };
                write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
            }

            ClientMessage::CommandRequest {
                command_id,
                command_type,
                idempotency_key,
                payload,
            } => {
                let Some(ref s) = session else {
                    let reply = ServerMessage::Error {
                        message: "command request before hello".to_string(),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };
                if pending.contains_key(&command_id) {
                    let reply = ServerMessage::CommandAckGotten { command_id };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                }
                pending.insert(
                    command_id.clone(),
                    PendingCommand {
                        command_type,
                        idempotency_key,
                        payload,
                    },
                );
                tracing::info!(
                    target: "sync",
                    user = %s.user_id,
                    %command_id,
                    "command held (not yet applied)"
                );
                let reply = ServerMessage::CommandAckGotten { command_id };
                write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
            }

            ClientMessage::CommandApplyRequest { command_id } => {
                let Some(ref s) = session else {
                    let reply = ServerMessage::Error {
                        message: "apply request before hello".to_string(),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };
                let Some(pc) = pending.remove(&command_id) else {
                    let reply = ServerMessage::CommandResponse {
                        command_id,
                        ok: false,
                        message: Some("no pending command with that id".to_string()),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };

                let handle = {
                    let projects = state.projects.read().await;
                    projects.get(&s.project_id).cloned()
                };
                let Some(handle) = handle else {
                    let reply = ServerMessage::CommandResponse {
                        command_id,
                        ok: false,
                        message: Some(format!(
                            "project {} not open on this Admin",
                            s.project_id
                        )),
                    };
                    write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    continue;
                };

                let idempotency_key = pc.idempotency_key.clone();
                let result = apply_command(
                    &handle.db,
                    &s.user_id,
                    &s.device_id,
                    &pc.command_type,
                    &pc.payload,
                )
                .await;

                match result {
                    Ok(response) => {
                        tracing::info!(
                            target: "sync",
                            user = %s.user_id,
                            %command_id,
                            idem = %idempotency_key,
                            "command applied"
                        );
                        let reply = ServerMessage::CommandApplied {
                            command_id,
                            resulting_sequence: None,
                            response,
                        };
                        write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    }
                    Err(e) => {
                        tracing::warn!(
                            target: "sync",
                            user = %s.user_id,
                            %command_id,
                            error = %e,
                            "command apply failed"
                        );
                        let reply = ServerMessage::CommandResponse {
                            command_id,
                            ok: false,
                            message: Some(e.to_string()),
                        };
                        write.send(Message::Text(serde_json::to_string(&reply)?)).await?;
                    }
                }
            }

            ClientMessage::CommandApplyConfirm { command_id } => {
                tracing::debug!(
                    target: "sync",
                    %command_id,
                    "client confirmed apply"
                );
            }
            ClientMessage::Ack {
                acked_through_sequence: _,
            } => {
                // Cursor tracking per-user is a later addition. For now, ack
                // is a no-op after Hello. A future version persists this in
                // a `sync_cursors` table on the Admin.
            }
        }
    }

    // Connection closed. Remove the user from SyncState.
    if let Some(s) = session {
        let mut sync = state.sync.write().await;
        sync.connected_users.retain(|u| u != &s.user_id);
    }
    Ok(())
}

struct SessionInfo {
    #[allow(dead_code)]
    session_id: String,
    user_id: String,
    device_id: String,
    project_id: String,
}

/// A command accepted by the Admin but not yet applied. Held per
/// connection, dropped when the connection closes.
struct PendingCommand {
    command_type: String,
    idempotency_key: String,
    payload: serde_json::Value,
}

/// Run a command inside a transaction. Commit on success, rollback on error.
async fn apply_command(
    pool: &sqlx::SqlitePool,
    actor: &str,
    device: &str,
    command_type: &str,
    payload: &serde_json::Value,
) -> crate::error::AppResult<serde_json::Value> {
    let mut tx = pool.begin().await?;
    let result = crate::commands::dispatch(&mut tx, actor, device, command_type, payload).await?;
    tx.commit().await?;
    Ok(result)
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::AppPaths;
    use tokio_tungstenite::connect_async;

    async fn test_state() -> Arc<AppState> {
        let tmp = std::env::temp_dir().join(format!("admin-sync-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&tmp).unwrap();
        let paths = AppPaths {
            data_dir: tmp.clone(),
            projects_dir: tmp.join("projects"),
            keys_dir: tmp.join("keys"),
            modules_dir: tmp.join("modules"),
            logs_dir: tmp.join("logs"),
            tailscale_state: tmp.join("tailscale.state"),
        };
        std::fs::create_dir_all(&paths.projects_dir).unwrap();
        std::fs::create_dir_all(&paths.keys_dir).unwrap();
        std::fs::create_dir_all(&paths.modules_dir).unwrap();
        std::fs::create_dir_all(&paths.logs_dir).unwrap();
        Arc::new(AppState::new(paths).unwrap())
    }

    #[tokio::test]
    async fn hello_then_heartbeat_roundtrip() {
        let state = test_state().await;
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        // Spawn the server on the bound listener.
        let srv_state = state.clone();
        let srv_task = tokio::spawn(async move {
            let (stream, peer) = listener.accept().await.unwrap();
            handle_connection(srv_state, stream, peer).await.unwrap();
        });

        // Connect a client.
        let url = format!("ws://{addr}");
        let (ws, _) = connect_async(&url).await.unwrap();
        let (mut write, mut read) = ws.split();

        // Send Hello.
        let hello = ClientMessage::Hello {
            protocol_version: PROTOCOL_VERSION,
            user_id: "user-1".to_string(),
            device_id: "dev-1".to_string(),
            project_id: "proj-1".to_string(),
            device_pubkey: "test-pubkey".to_string(),
            device_signature: "test-sig".to_string(),
        };
        write
            .send(Message::Text(serde_json::to_string(&hello).unwrap()))
            .await
            .unwrap();

        let reply = read.next().await.unwrap().unwrap();
        let msg: ServerMessage = serde_json::from_str(reply.to_text().unwrap()).unwrap();
        assert!(matches!(msg, ServerMessage::Welcome { .. }));

        // Send Heartbeat.
        write
            .send(Message::Text(serde_json::to_string(&ClientMessage::Heartbeat).unwrap()))
            .await
            .unwrap();

        let reply = read.next().await.unwrap().unwrap();
        let msg: ServerMessage = serde_json::from_str(reply.to_text().unwrap()).unwrap();
        assert!(matches!(msg, ServerMessage::HeartbeatAck));

        // Close.
        drop(write);
        let _ = srv_task.await;
    }

    #[tokio::test]
    async fn rejects_wrong_protocol_version() {
        let state = test_state().await;
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        let srv_state = state.clone();
        let srv_task = tokio::spawn(async move {
            let (stream, peer) = listener.accept().await.unwrap();
            handle_connection(srv_state, stream, peer).await.unwrap();
        });

        let url = format!("ws://{addr}");
        let (ws, _) = connect_async(&url).await.unwrap();
        let (mut write, mut read) = ws.split();

        let hello = ClientMessage::Hello {
            protocol_version: 99,
            user_id: "user-1".to_string(),
            device_id: "dev-1".to_string(),
            project_id: "proj-1".to_string(),
            device_pubkey: "test-pubkey".to_string(),
            device_signature: "test-sig".to_string(),
        };
        write
            .send(Message::Text(serde_json::to_string(&hello).unwrap()))
            .await
            .unwrap();

        let reply = read.next().await.unwrap().unwrap();
        let msg: ServerMessage = serde_json::from_str(reply.to_text().unwrap()).unwrap();
        match msg {
            ServerMessage::Error { message } => assert!(message.contains("unsupported protocol")),
            other => panic!("expected error, got {other:?}"),
        }

        drop(write);
        let _ = srv_task.await;
    }
}
