//! CHAOS-007: signatures from the wrong device are rejected.
//!
//! The Admin hello verification must accept only the correct signer.

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;

use admin::sync::hello_verify::{hello_signing_bytes, verify_hello_signature};

#[test]
fn attacker_signature_is_rejected() {
    let real = SigningKey::generate(&mut OsRng);
    let attacker = SigningKey::generate(&mut OsRng);

    let user_id = "usr_abcdefghijklmnopqrstuv";
    let project_id = "proj_abcdefghijklmnopqrstuv";
    let bytes = hello_signing_bytes(1, user_id, project_id);

    let real_sig = real.sign(&bytes);
    let attacker_sig = attacker.sign(&bytes);

    let real_pk_b64 = B64.encode(real.verifying_key().to_bytes());

    // Real signature: accepted.
    assert!(verify_hello_signature(
        &real_pk_b64,
        &B64.encode(real_sig.to_bytes()),
        1,
        user_id,
        project_id,
    )
    .is_ok());

    // Attacker signature against real pubkey: rejected.
    assert!(verify_hello_signature(
        &real_pk_b64,
        &B64.encode(attacker_sig.to_bytes()),
        1,
        user_id,
        project_id,
    )
    .is_err());
}
