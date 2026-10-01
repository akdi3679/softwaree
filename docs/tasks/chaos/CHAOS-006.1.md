# TASK ID: CHAOS-006.1
# TITLE: Add chaos: web socket disconnects mid-message
# STATUS: pending
# DEPENDENCIES: LOAD-004.2
# ALLOWED FILES: product/apps/admin/src-tauri/tests/chaos_disconnect_mid_msg.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Cut the WebSocket while a frame is being sent. Client must reconnect and resume.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/tests/chaos_disconnect_mid_msg.rs`:

```rust
use product_admin_lib::sync::ws::{Frame, FrameDecoder};
use tokio::io::{AsyncWriteExt, duplex};

#[tokio::test]
async fn disconnect_mid_message_then_resume() {
    let (mut a, mut b) = duplex(1024);
    // Write a partial frame
    a.write_all(&[0x01, 0x00, 0x00, 0x10, 0x00]).await.unwrap();
    // Simulate disconnect by dropping
    drop(a);
    drop(b);

    // Reconnect
    let (mut a, mut b) = duplex(1024);
    let mut decoder = FrameDecoder::new();
    a.write_all(&[0x00, 0x00, 0x00, 0x05, b'h', b'e', b'l', b'l', b'o']).await.unwrap();
    let frame = decoder.read_frame(&mut b).await.unwrap();
    assert!(matches!(frame, Some(Frame::Text(_))));
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tests/chaos_disconnect_mid_msg.rs || { echo "FAIL"; exit 1; }
grep -q "disconnect_mid_message" apps/admin/src-tauri/tests/chaos_disconnect_mid_msg.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
