# Performance critical paths

## Path 1: Command execution (Admin)

Flow:

    UI click -> Tauri IPC -> authz -> SQLite transaction (data plus event plus audit) -> commit -> response

Target: under 50ms p99 for simple commands.

Bottlenecks: SQLite commit (5-30ms), authz check (5-10ms), IPC (1-5ms).

Optimizations:

- Single transaction: data plus event plus audit in one BEGIN and COMMIT.
- Authz: pre-compute role-permission map, cache 60s.
- SQLite: WAL mode, indexes on hot queries.

## Path 2: Sync (User to Admin)

Flow:

    User WS open -> hello (signed) -> Welcome -> sync_request -> events -> ack

Target: under 200ms for a 100-event batch.

Optimizations:

- Batch events (100 per frame, not one by one).
- Pre-serialize events in Admin (not per User).
- CBOR for events over 1KB.
- In-memory per-User queue.

## Path 3: Backup encrypt and upload (Admin)

Flow:

    SQLite read -> AES-GCM encrypt -> SHA-256 -> multipart to MinIO

Target: under 1s for a 10MB backup.

Optimizations:

- Stream encryption (do not load DB into memory).
- Chunked transfer to MinIO.
- SHA-256 computed during read, not after.

## Path 4: Cloud API

Flow:

    HTTP -> middleware (auth, rate limit) -> handler -> Postgres -> response

Target: under 100ms p99 for GET.

Optimizations:

- Pool sized for peak QPS.
- Indexes on all hot queries.
- Read replica for SELECTs (Stage 1 and above).
- Bypass ORM for simplest queries.

## What we measure

Every Tauri command emits a metric. Every Cloud request emits a trace. Every backup emits a metric.

Prometheus alerts on:

- p99 over target for 5 min
- Error rate over 1 percent for 5 min
- Memory over 80 percent limit

## Profiling tools

- cargo flamegraph for Rust
- 0x for Node
- Chrome DevTools for React

## What we do not optimize

- Admin cold start (users keep it open).
- First backup after install (one-time).
- First sync after User opens app.
- Module install (rare).
