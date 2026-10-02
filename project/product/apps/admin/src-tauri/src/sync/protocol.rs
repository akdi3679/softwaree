//! Wire protocol for the Admin <-> User sync channel.
//!
//! Transport: WebSocket, one JSON message per frame.
//! Message shapes mirror the User app's `sync::client` exactly (see
//! `apps/user/src-tauri/src/sync/client.rs`).

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const PROTOCOL_VERSION: u32 = 1;
pub const DEFAULT_MAX_EVENTS: i64 = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    Hello {
        protocol_version: u32,
        user_id: String,
        device_id: String,
        project_id: String,
        device_pubkey: String,
        device_signature: String,
    },
    SyncRequest {
        last_sequence: i64,
        max_events: Option<i64>,
    },
    Ack {
        acked_through_sequence: i64,
    },
    Heartbeat,

    // ---------------------------------------------------------------------
    // Two-phase command handshake.
    //
    // The User app never writes directly. It asks the Admin to hold a
    // command, then asks the Admin to apply it. If the Admin goes offline
    // between the two, the User is stuck but nothing has been written.
    // The Admin's `CommandApplied` is the definitive success signal.
    // ---------------------------------------------------------------------
    CommandRequest {
        command_id: String,
        command_type: String,
        idempotency_key: String,
        payload: Value,
    },
    CommandApplyRequest {
        command_id: String,
    },
    CommandApplyConfirm {
        command_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    Welcome {
        session_id: String,
    },
    SyncResponse {
        mode: String,
        from_sequence: i64,
        to_sequence: i64,
        events: Option<Vec<Value>>,
        snapshot: Option<Value>,
        has_more: Option<bool>,
    },
    Event(Value),
    Error {
        message: String,
    },
    HeartbeatAck,

    // Handshake responses.
    CommandAckGotten {
        command_id: String,
    },
    CommandApplied {
        command_id: String,
        resulting_sequence: Option<i64>,
        response: Value,
    },
    CommandResponse {
        command_id: String,
        ok: bool,
        message: Option<String>,
    },
}