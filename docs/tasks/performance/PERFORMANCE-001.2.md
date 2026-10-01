# TASK ID: PERFORMANCE-001.2
# TITLE: Add Admin SQLite benchmark suite
# STATUS: pending
# DEPENDENCIES: PERFORMANCE-001.1
# ALLOWED FILES: product/apps/admin/src-tauri/benches/sqlite_bench.rs, product/apps/admin/src-tauri/Cargo.toml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add Criterion benchmarks for the Admin's hot path: event append, range read, projection apply.

## REQUIRED IMPLEMENTATION

Add to `product/apps/admin/src-tauri/Cargo.toml`:

```toml
[[bench]]
name = "sqlite_bench"
harness = false
```

Create `product/apps/admin/src-tauri/benches/sqlite_bench.rs`:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;

async fn setup_pool() -> SqlitePool {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();
    sqlx::query(include_str!("../migrations/002_outbox.sql"))
        .execute(&pool)
        .await
        .unwrap();
    pool
}

fn bench_append(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let pool = rt.block_on(setup_pool());
    c.bench_function("event_append", |b| {
        b.iter(|| {
            rt.block_on(async {
                let seq: i64 = sqlx::query_scalar(
                    r#"
                    INSERT INTO events (event_id, event_type, aggregate_type, aggregate_id,
                                        aggregate_version, actor_user_id, device_id, occurred_at,
                                        correlation_id, causation_id, payload)
                    VALUES (?, 'test.event', 'test', 't_1', 1, 'u', 'd', '2026-01-01', NULL, NULL, '{}')
                    RETURNING sequence
                    "#,
                )
                .bind(format!("evt_{}", fastrand::u64(..)))
                .fetch_one(&pool)
                .await
                .unwrap();
                black_box(seq);
            });
        });
    });
}

fn bench_read_range(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let pool = rt.block_on(async {
        let p = setup_pool().await;
        for i in 0..10_000 {
            sqlx::query(
                r#"
                INSERT INTO events (event_id, event_type, aggregate_type, aggregate_id,
                                    aggregate_version, actor_user_id, device_id, occurred_at,
                                    correlation_id, causation_id, payload)
                VALUES (?, 'test.event', 'test', 't_1', 1, 'u', 'd', '2026-01-01', NULL, NULL, '{}')
                "#,
            )
            .bind(format!("evt_{i}"))
            .execute(&p)
            .await
            .unwrap();
        }
        p
    });
    c.bench_function("event_read_range_100", |b| {
        b.iter(|| {
            rt.block_on(async {
                let rows: Vec<(i64,)> = sqlx::query_as(
                    "SELECT sequence FROM events WHERE sequence > ? ORDER BY sequence ASC LIMIT ?",
                )
                .bind(5000i64)
                .bind(100i64)
                .fetch_all(&pool)
                .await
                .unwrap();
                black_box(rows.len());
            });
        });
    });
}

criterion_group!(benches, bench_append, bench_read_range);
criterion_main!(benches);
```

Add dev-dependencies to Cargo.toml:
```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["async_tokio"] }
fastrand = "2"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/benches/sqlite_bench.rs || { echo "FAIL"; exit 1; }
grep -q "criterion" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no criterion"; exit 1; }
echo "OK"
```
