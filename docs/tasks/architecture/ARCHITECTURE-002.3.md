# TASK ID: ARCHITECTURE-002.3
# TITLE: Add 07-PERFORMANCE (perf critical paths)
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-002.2
# ALLOWED FILES: /workspace/docs/architecture/07-PERFORMANCE.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Profile the hot paths and document optimization strategy.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/07-PERFORMANCE.md`:

```markdown
# Performance critical paths

The hot paths we MUST keep fast.

## Path 1: Command execution (Admin)

```
UI click → Tauri IPC → authz check → SQLite transaction (data + event + audit) → commit → response → UI render
```

**Current target**: < 50ms p99 for a simple command (e.g., create user).

**Bottleneck candidates**:
- SQLite transaction (5-30ms)
- Authz check (5-10ms)
- Tauri IPC (1-5ms)

**Optimizations**:
- Single transaction: data + event + audit in one BEGIN/COMMIT (already done)
- Authz: pre-compute user's role-permission map, cache for 60s
- SQLite: WAL mode, indexes on (id, project_id, occurred_at)
- WASM module invocation: only if the command is from a module

## Path 2: Sync (User → Admin)

```
User WS open → hello (signed) → Welcome → sync_request → events → ack
```

**Current target**: < 200ms for a 100-event batch.

**Optimizations**:
- Send events in batches of 100, not 1-by-1
- Pre-serialize events in the Admin (don't re-serialize per User)
- Use binary frames for events > 1KB (saves serialization overhead)
- Admin maintains an in-memory queue per connected User

## Path 3: Backup encrypt + upload (Admin)

```
SQLite read → AES-GCM encrypt → SHA-256 → multipart upload to MinIO
```

**Current target**: < 1s for a 10MB backup.

**Optimizations**:
- Stream the encryption (don't load full DB into memory)
- Use Chunked transfer encoding to MinIO
- Pre-compute SHA-256 during the read (not after)

## Path 4: Cloud API request

```
HTTP request → middleware (auth, rate limit) → handler → Postgres → response
```

**Current target**: < 100ms p99 for a simple GET.

**Optimizations**:
- Connection pool sized for peak QPS
- Indexes on all hot queries
- Hot path bypasses Drizzle (raw SQL for the simplest queries)
- Read replica for SELECTs

## What we measure

Every request to a Tauri command emits a metric. Every Cloud request emits a trace. Every backup emits a metric.

We use Prometheus to alert on:
- p99 > target for 5 minutes
- Error rate > 1% for 5 minutes
- Memory > 80% of limit

## Profiling

We use:
- `cargo flamegraph` for Rust (Admin, User, Cloud, modules)
- `0x` for Node (Cloud)
- Chrome DevTools for the React app

Profiling is part of the release checklist.

## What we DON'T optimize

- Cold start of the Admin (rarely happens; users keep the app open)
- The first backup after install (one-time)
- The first sync after the User opens the app
- Module install (rare, can be slow)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/07-PERFORMANCE.md || { echo "FAIL"; exit 1; }
grep -q "Performance critical paths" docs/architecture/07-PERFORMANCE.md || { echo "FAIL"; exit 1; }
echo "OK"
```
