use product_user_lib::{
    crypto::device_key::DeviceKey,
    db::projection_db::ProjectionDb,
    projection::applier::{apply_batch, WireEvent},
    sync::client::{AdminEndpoint, SyncClient},
};
use futures_util::{SinkExt, StreamExt};
use serde_json::json;
use std::net::SocketAddr;
use std::time::Duration;
use tempfile::tempdir;
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;

#[tokio::test]
async fn full_sync_flow() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let admin_task = tokio::spawn(async move {
        let (stream, _) = listener.accept().await.unwrap();
        let ws = tokio_tungstenite::accept_async(stream).await.unwrap();
        let (mut tx, mut rx) = ws.split();
        let msg = rx.next().await.unwrap().unwrap();
        let _: serde_json::Value = serde_json::from_str(&msg.into_text().unwrap()).unwrap();
        tx.send(Message::Text(serde_json::to_string(&json!({"type":"welcome","session_id":"sess_test"})).unwrap())).await.unwrap();
        let msg = rx.next().await.unwrap().unwrap();
        let _: serde_json::Value = serde_json::from_str(&msg.into_text().unwrap()).unwrap();
        let event = json!({
            "sequence": 1, "event_id": "evt_1", "event_type": "user.created",
            "aggregate_type": "user", "aggregate_id": "usr_1", "aggregate_version": 1,
            "actor_user_id": "usr_admin", "device_id": "dev_1",
            "occurred_at": "2026-01-01T00:00:00Z", "correlation_id": null, "causation_id": null,
            "payload": { "user_id": "usr_1", "email": "a@b.c", "display_name": "A" }
        });
        tx.send(Message::Text(serde_json::to_string(&json!({
            "type":"sync_response","mode":"events","from_sequence":0,"to_sequence":1,"events":[event],"has_more":false
        })).unwrap())).await.unwrap();
        let msg = rx.next().await.unwrap().unwrap();
        let ack: serde_json::Value = serde_json::from_str(&msg.into_text().unwrap()).unwrap();
        assert_eq!(ack["acked_through_sequence"], json!(1));
    });

    let endpoint = AdminEndpoint { host: addr.ip().to_string(), port: addr.port() };
    let key = DeviceKey::generate();
    let (client, session) = tokio::time::timeout(
        Duration::from_secs(5),
        SyncClient::connect(&endpoint, "usr_1", &key, "proj_1", "auth"),
    ).await.unwrap().unwrap();
    assert_eq!(session, "sess_test");

    let tmp = tempdir().unwrap();
    let db_path = tmp.path().join("proj.sqlite");
    let db = ProjectionDb::open(&db_path, "proj_1").await.unwrap();
    let event = WireEvent {
        sequence: 1, event_id: "evt_1".into(), event_type: "user.created".into(),
        aggregate_type: "user".into(), aggregate_id: "usr_1".into(), aggregate_version: 1,
        actor_user_id: "usr_admin".into(), device_id: "dev_1".into(),
        occurred_at: "2026-01-01T00:00:00Z".into(), correlation_id: None, causation_id: None,
        payload: json!({ "user_id": "usr_1", "email": "a@b.c", "display_name": "A" }),
    };
    let last = apply_batch(&db, &[event]).await.unwrap();
    assert_eq!(last, 1);
    client.ack(1).await.unwrap();
    let pos = db.get_position().await.unwrap();
    assert_eq!(pos, 1);

    admin_task.await.unwrap();
}
