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
        let hello = rx.next().await.unwrap().unwrap();
        let hello_text = hello.into_text().unwrap();
        let parsed: ClientMessage = serde_json::from_str(&hello_text).unwrap();
        match parsed { ClientMessage::Hello { protocol_version, .. } => assert_eq!(protocol_version, 1), _ => panic!("expected hello") }
        let welcome = ServerMessage::Welcome { session_id: "sess_abc".into() };
        tx.send(Message::Text(serde_json::to_string(&welcome).unwrap())).await.unwrap();
    });
    let endpoint = AdminEndpoint { host: addr.ip().to_string(), port: addr.port() };
    let key = DeviceKey::generate();
    let result = tokio::time::timeout(Duration::from_secs(5), SyncClient::connect(&endpoint, "usr_1", &key, "proj_1", "auth")).await;
    let (_client, session) = result.unwrap().unwrap();
    assert_eq!(session, "sess_abc");
    server_task.await.unwrap();
}
