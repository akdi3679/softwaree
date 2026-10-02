use std::sync::Arc;
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{WebSocketStream, tungstenite::Message};
use tokio_tungstenite::client_async;

use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

const PROTOCOL_VERSION: u32 = 1;

#[derive(Debug, Clone)]
pub struct AdminEndpoint { pub host: String, pub port: u16 }

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    Hello { protocol_version: u32, user_id: String, device_id: String, project_id: String, device_pubkey: String, device_signature: String },
    SyncRequest { last_sequence: i64, max_events: Option<i64> },
    Ack { acked_through_sequence: i64 },
    Heartbeat,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    Welcome { session_id: String },
    SyncResponse { mode: String, from_sequence: i64, to_sequence: i64, events: Option<Vec<Value>>, snapshot: Option<Value>, has_more: Option<bool> },
    Event(Value),
    Error { message: String },
    HeartbeatAck,
}

pub struct SyncClient {
    pub write: Arc<Mutex<futures_util::stream::SplitSink<WebSocketStream<TcpStream>, Message>>>,
    pub read_task: Option<tokio::task::JoinHandle<()>>,
}

impl SyncClient {
    pub async fn connect(endpoint: &AdminEndpoint, user_id: &str, device: &DeviceKey, project_id: &str, _auth_token: &str) -> AppResult<(Self, String)> {
        let url = format!("ws://{}:{}/sync", endpoint.host, endpoint.port);
        let (ws, _) = client_async(&url, TcpStream::connect((endpoint.host.as_str(), endpoint.port)).await?)
            .await.map_err(|e| AppError::Network(format!("ws handshake: {e}")))?;
        let (mut write, mut read) = ws.split();
        let hello_payload = format!("hello{}{}{}", PROTOCOL_VERSION, user_id, project_id);
        let signature = device.sign(hello_payload.as_bytes());
        let hello = ClientMessage::Hello {
            protocol_version: PROTOCOL_VERSION,
            user_id: user_id.to_string(),
            device_id: device.public_key_b64(),
            project_id: project_id.to_string(),
            device_pubkey: device.public_key_b64(),
            device_signature: B64.encode(signature),
        };
        let hello_json = serde_json::to_string(&hello).map_err(|e| AppError::Protocol(e.to_string()))?;
        write.send(Message::Text(hello_json)).await.map_err(|e| AppError::Network(format!("send hello: {e}")))?;
        let welcome_msg = tokio::time::timeout(std::time::Duration::from_secs(10), read.next()).await
            .map_err(|_| AppError::Protocol("no welcome within 10s".into()))?
            .ok_or_else(|| AppError::Protocol("connection closed before welcome".into()))?
            .map_err(|e| AppError::Network(format!("ws recv: {e}")))?;
        let welcome_text = welcome_msg.into_text().map_err(|e| AppError::Protocol(format!("not text: {e}")))?;
        let welcome: ServerMessage = serde_json::from_str(&welcome_text).map_err(|e| AppError::Protocol(format!("welcome parse: {e}")))?;
        let session_id = match welcome { ServerMessage::Welcome { session_id } => session_id, other => return Err(AppError::Protocol(format!("expected welcome, got {other:?}"))) };
        Ok((SyncClient { write: Arc::new(Mutex::new(write)), read_task: None }, session_id))
    }

    pub async fn heartbeat(&self) -> AppResult<()> {
        let hb = ClientMessage::Heartbeat;
        let json = serde_json::to_string(&hb).map_err(|e| AppError::Protocol(e.to_string()))?;
        self.write.lock().await.send(Message::Text(json)).await.map_err(|e| AppError::Network(format!("send heartbeat: {e}")))?;
        Ok(())
    }

    pub async fn ack(&self, acked_through_sequence: i64) -> AppResult<()> {
        let ack = ClientMessage::Ack { acked_through_sequence };
        let json = serde_json::to_string(&ack).map_err(|e| AppError::Protocol(e.to_string()))?;
        self.write.lock().await.send(Message::Text(json)).await.map_err(|e| AppError::Network(format!("send ack: {e}")))?;
        Ok(())
    }
}
