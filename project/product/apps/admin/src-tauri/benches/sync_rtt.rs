//! Benchmark: sync frame round-trip.
//!
//! Target: < 50ms p99 for LAN (this measures the encode/decode half of RTT;
//! the network half is measured end-to-end in the admin↔user integration test).
//! Run: `cargo bench --bench sync_rtt`

use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;

use admin::sync::cbor_frame;

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct FakeFrame {
    frame_type: u8,
    sequence: i64,
    event_type: String,
    payload: Vec<u8>,
}

fn small_frame() -> FakeFrame {
    FakeFrame {
        frame_type: 0x05,
        sequence: 42,
        event_type: "patient.created".to_string(),
        payload: vec![0u8; 128],
    }
}

fn large_frame() -> FakeFrame {
    FakeFrame {
        frame_type: 0x06,
        sequence: 100_000,
        event_type: "snapshot.payload".to_string(),
        payload: vec![7u8; 256 * 1024],
    }
}

fn bench_rtt(c: &mut Criterion) {
    let mut group = c.benchmark_group("sync_rtt");

    group.bench_function("encode_decode_small", |b| {
        b.iter(|| {
            let f = small_frame();
            let bytes = cbor_frame::encode(&f).expect("encode");
            let decoded: FakeFrame = cbor_frame::decode(&bytes).expect("decode");
            black_box(decoded);
        });
    });

    group.bench_function("encode_decode_large", |b| {
        b.iter(|| {
            let f = large_frame();
            let bytes = cbor_frame::encode(&f).expect("encode");
            let decoded: FakeFrame = cbor_frame::decode(&bytes).expect("decode");
            black_box(decoded);
        });
    });

    group.finish();
}

criterion_group!(benches, bench_rtt);
criterion_main!(benches);