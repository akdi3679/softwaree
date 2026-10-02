# Cold start optimization

## Budgets

| Stage | Budget | What runs |
|---|---|---|
| Admin first-run | under 2s | Key load, DB open, migrations, module registry |
| Admin warm start | under 500ms | Key load, DB open |
| User first-run | under 1.5s | Key load, DB open, first sync |
| Cloud cold boot | under 5s | Config load, DB connect, migrations check |

## Admin startup sequence

1. Tauri builder init - 50ms
2. Load device key from OS keychain - 20ms
3. Open system DB and run migrations - 100ms
4. Load project registry - 30ms
5. For each known project, open SQLite - 50ms per project (parallel)
6. Spawn background workers (outbox dispatcher, mDNS advertiser, discovery heartbeat, reconnect throttle) - 30ms
7. Expose Tauri commands - 10ms
8. Frontend render - 200ms

Total: about 500ms warm, about 2s first-run.

## What we defer

- Module binary loading: on first use, not startup
- Backup crypto key derivation: on first backup
- Sync server start: only when a User connects
- Full-text search index build: background task

## What we do NOT do at startup

- Network calls to Cloud (auth is lazy)
- Full-project SQLite migration (lazy per-project)
- Wasmtime instantiation

## Cloud startup

1. Load env (dotenv) - 10ms
2. initTracing() - 100ms
3. startHeartbeatLoop() - async, non-blocking
4. DB pool warmup (1 ping) - 50ms
5. Bind Hono to port - 30ms

Total: under 500ms plus Postgres connection time.