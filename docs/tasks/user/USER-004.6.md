# TASK ID: USER-004.6
# TITLE: Add User unit tests
# STATUS: pending
# DEPENDENCIES: USER-004.5
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/client_tests.rs, product/apps/user/src-tauri/tests/sync_handshake.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add unit tests for the sync client and integration tests for the handshake.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/client_tests.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::device_key::DeviceKey;
    use crate::db::projection_db::ProjectionDb;
    use crate::projection::applier::{apply_batch, WireEvent};
    use serde_json::json;
    use tempfile::tempdir;

    #[test]
    fn device_key_sign_and_verify() {
        let key = DeviceKey::generate();
        let msg = b"hello";
        let sig = key.sign(msg);
        DeviceKey::verify(&key.public_key_bytes(), msg, &sig).unwrap();
    }

    #[tokio::test]
    async fn apply_user_created_event() {
        let tmp = tempdir().unwrap();
        let db_path = tmp.path().join("proj.sqlite");
        let db = ProjectionDb::open(&db_path, "proj_test").await.unwrap();
        let event = WireEvent {
            sequence: 1,
            event_id: "evt_abc".into(),
            event_type: "user.created".into(),
            aggregate_type: "user".into(),
            aggregate_id: "usr_xyz".into(),
            aggregate_version: 1,
            actor_user_id: "usr_admin".into(),
            device_id: "dev_a".into(),
            occurred_at: chrono::Utc::now().to_rfc3339(),
            correlation_id: None,
            causation_id: None,
            payload: json!({
                "user_id": "usr_xyz",
                "email": "a@b.c",
                "display_name": "A B",
            }),
        };
        let last = apply_batch(&db, &[event]).await.unwrap();
        assert_eq!(last, 1);
        let pos = db.get_position().await.unwrap();
        assert_eq!(pos, 1);
    }
}
```

Create `product/apps/user/src-tauri/tests/sync_handshake.rs`:

```rust
//! Integration test for the sync handshake. Spins up a mock server, runs the client.

use product_user_lib::crypto::device_key::DeviceKey;
use product_user_lib::sync::client::{AdminEndpoint, ClientMessage, ServerMessage, SyncClient};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};

#[tokio::test]
async fn handshake_against_mock_server() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr: SocketAddr = listener.local_addr().unwrap();

    let server_task = tokio::spawn(async move {
        let (stream, _) = listener.accept().await.unwrap();
        let ws = tokio_tungstenite::accept_async(stream).await.unwrap();
        let (mut tx, mut rx) = ws.split();
        // Expect Hello
        let hello = rx.next().await.unwrap().unwrap();
        let hello_text = hello.into_text().unwrap();
        let parsed: ClientMessage = serde_json::from_str(&hello_text).unwrap();
        match parsed {
            ClientMessage::Hello { protocol_version, .. } => {
                assert_eq!(protocol_version, 1);
            }
            _ => panic!("expected hello"),
        }
        // Send Welcome
        let welcome = ServerMessage::Welcome { session_id: "sess_abc".into() };
        tx.send(Message::Text(serde_json::to_string(&welcome).unwrap())).await.unwrap();
    });

    let endpoint = AdminEndpoint { host: addr.ip().to_string(), port: addr.port() };
    let key = DeviceKey::generate();
    let result = tokio::time::timeout(
        Duration::from_secs(5),
        SyncClient::connect(&endpoint, "usr_1", &key, "proj_1", "auth"),
    ).await;
    let (_client, session) = result.unwrap().unwrap();
    assert_eq!(session, "sess_abc");

    server_task.await.unwrap();
}
```

Add to Cargo.toml:
```toml
[dev-dependencies]
tempfile = "3"
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/client_tests.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/tests/sync_handshake.rs || { echo "FAIL: no integration test"; exit 1; }
grep -q "tempfile" apps/user/src-tauri/Cargo.toml || { echo "FAIL: no tempfile dep"; exit 1; }
echo "OK"
```
