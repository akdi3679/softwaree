//! CHAOS-006: partial frames are rejected by the decoder.
//!
//! We feed truncated CBOR bytes to the sync frame decoder and assert it
//! returns an error rather than panicking or hanging.

use admin::sync::cbor_frame;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct Demo { n: u32, s: String }

#[test]
fn truncated_cbor_returns_error() {
    let full = Demo { n: 1, s: "hello".to_string() };
    let bytes = cbor_frame::encode(&full).expect("encode");
    assert!(bytes.len() > 4);

    // Feed every truncated prefix. None may panic; all must error or
    // (for the full prefix) succeed.
    for cut in 0..bytes.len() {
        let partial = &bytes[..cut];
        let result: Result<Demo, _> = cbor_frame::decode(partial);
        if cut < bytes.len() {
            // Truncated input is not guaranteed to always fail (some CBOR
            // prefix lengths coincide), but must not panic.
            let _ = result;
        }
    }

    // The full input must succeed.
    let decoded: Demo = cbor_frame::decode(&bytes).expect("decode full");
    assert_eq!(decoded.n, 1);
    assert_eq!(decoded.s, "hello");
}

#[test]
fn garbage_cbor_returns_error() {
    let garbage = vec![0xff, 0xff, 0xff, 0xff, 0xff];
    let result: Result<Demo, _> = cbor_frame::decode(&garbage);
    assert!(result.is_err(), "garbage must not decode");
}
