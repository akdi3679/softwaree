# TASK ID: ARCH-006.1
# TITLE: Add architecture: deployment topology diagram
# STATUS: pending
# DEPENDENCIES: SECURITY-007.2
# ALLOWED FILES: docs/architecture/TOPOLOGY.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
ASCII diagram of the full system.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/TOPOLOGY.md`:

```markdown
# Deployment Topology

## Stage 0 (single VM, < 100 users)

```
┌──────────────────────────────────────────────────────────┐
│                   Customer Location                      │
│                                                            │
│  ┌──────────────┐              ┌──────────────┐         │
│  │ Admin Laptop │ ── mDNS ──── │  User Laptop │         │
│  │  (Tauri)     │   LAN       │  (Tauri)     │         │
│  │              │              │              │         │
│  │  SQLite      │              │  Projection  │         │
│  │  Wasmtime    │              │  (read only) │         │
│  │  Modules     │              │              │         │
│  └──────┬───────┘              └──────┬───────┘         │
│         │                             │                  │
└─────────┼─────────────────────────────┼──────────────────┘
          │                             │
          │    our WireGuard mesh (project)
          │                             │
          │           ┌─────────────────┴────────┐
          └─────────► │      Cloud              │
                      │      (Hetzner VM)       │
                      │                          │
                      │  ┌──────┐  ┌────────┐  │
                      │  │ Hono │  │  PGSQL │  │
                      │  │ Node │  │  16    │  │
                      │  └──────┘  └────────┘  │
                      │  ┌──────┐               │
                      │  │MinIO │               │
                      │  │(blob)│               │
                      │  └──────┘               │
                      │  ┌──────────┐           │
                      │  │Discovery │           │
                      │  │(self-host)│           │
                      │  └──────────┘           │
                      └──────────────────────────┘
```

## Stage 3 (multi-region, 10K-100K users)

```
EU Region                    US Region                  APAC Region
┌─────────────────────┐     ┌─────────────────────┐    ┌─────────────────────┐
│ Postgres Primary    │ ──► │ Postgres Replica    │    │ Postgres Replica    │
│  + 2 read replicas  │     │  + 1 read replica   │    │  + 1 read replica   │
│                     │     │                     │    │                     │
│ App × 6 nodes       │     │ App × 4 nodes       │    │ App × 2 nodes       │
│                     │     │                     │    │                     │
│ MinIO (erasure)     │     │ MinIO replica       │    │ MinIO replica       │
│ Redis × 3           │     │ Redis × 3           │    │ Redis × 1           │
│ NATS × 3            │     │ NATS × 3            │    │ NATS × 1            │
│ OpenSearch          │     │                     │    │                     │
└─────────────────────┘     └─────────────────────┘    └─────────────────────┘
        │                            │                          │
        └────────────────────────────┴──────────────────────────┘
                                     │
                              Cloudflare (CDN + DDoS)
                                     │
                              ┌──────┴──────┐
                              │   Users     │
                              └─────────────┘
```

## Key principles

1. **One Admin per project, but projects scale horizontally.**
2. **Cloud is the control plane, not the data plane.** A user without cloud
   can still read their projection.
3. **our WireGuard mesh connects everything.** Even if Cloud is down, Admin and Users
   in the same project tailnet keep working.
4. **MinIO is the only encrypted blob store.** Cloud cannot decrypt; only
   the Admin (or designated recovery admin) holds the key.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TOPOLOGY.md || { echo "FAIL"; exit 1; }
grep -q "Stage 0" docs/architecture/TOPOLOGY.md || { echo "FAIL"; exit 1; }
echo "OK"
```
