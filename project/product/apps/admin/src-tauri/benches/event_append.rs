//! Benchmark: event store append throughput.
//!
//! Target: > 10,000 events/sec on a developer laptop.
//! Run: `cargo bench --bench event_append`

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use sqlx::sqlite::SqlitePoolOptions;
use std::hint::black_box;
use tokio::runtime::Runtime;

async fn make_pool() -> sqlx::SqlitePool {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("open in-memory sqlite");
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS events (\
            sequence INTEGER PRIMARY KEY AUTOINCREMENT,\
            event_id TEXT NOT NULL UNIQUE,\
            event_type TEXT NOT NULL,\
            aggregate_type TEXT NOT NULL,\
            aggregate_id TEXT NOT NULL,\
            aggregate_version INTEGER NOT NULL,\
            actor_user_id TEXT NOT NULL,\
            device_id TEXT NOT NULL,\
            occurred_at TEXT NOT NULL,\
            payload TEXT NOT NULL\
         )",
    )
    .execute(&pool)
    .await
    .expect("create events table");
    pool
}

fn bench_event_append(c: &mut Criterion) {
    let rt = Runtime::new().expect("runtime");
    let pool = rt.block_on(make_pool());

    let mut group = c.benchmark_group("event_append");
    group.throughput(Throughput::Elements(1000));
    group.bench_function(BenchmarkId::from_parameter("1000_batch"), |b| {
        let mut seq: u64 = 0;
        b.to_async(&rt).iter(|| {
            let pool = pool.clone();
            async move {
                for i in 0..1000 {
                    seq += 1;
                    let eid = format!("evt_{}", seq);
                    let aid = format!("agg_{}", i % 100);
                    let _ = sqlx::query(
                        "INSERT INTO events (event_id, event_type, aggregate_type, aggregate_id, aggregate_version, actor_user_id, device_id, occurred_at, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    )
                    .bind(&eid)
                    .bind("bench.appended")
                    .bind("bench")
                    .bind(&aid)
                    .bind(1_i64)
                    .bind("usr_bench")
                    .bind("dev_bench")
                    .bind("2026-01-01T00:00:00Z")
                    .bind(r#"{"n":1}"#)
                    .execute(&pool)
                    .await;
                }
                black_box(seq);
            }
        });
    });
    group.finish();
}

criterion_group!(benches, bench_event_append);
criterion_main!(benches);