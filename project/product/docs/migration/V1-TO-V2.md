# v1 to v2 migration

How a project moves from single-Admin to multi-Admin.

## What changes in v2

- Multiple Admins per project (2-5 doctors sharing a clinic).
- Writes require quorum (Raft or equivalent).
- Source of truth becomes a replicated log, not a single device.

## Migration steps

1. Backup: full backup before starting.
2. Pick the leader: designate one Admin as initial primary.
3. Add co-admin: invite via Cloud.
4. Sync data: new Admin downloads full project from primary.
5. Test writes: verify conflict resolution works.
6. Cutover: primary becomes peer; all Admins are equal.

## Data model changes (v2 only)

    CREATE TABLE project_admins (
      project_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (project_id, admin_id)
    );

    CREATE TABLE admin_replication_log (
      sequence INTEGER PRIMARY KEY,
      admin_id TEXT NOT NULL,
      term INTEGER NOT NULL,
      payload BLOB NOT NULL
    );

    CREATE TABLE admin_quorum_state (
      term INTEGER NOT NULL,
      voted_for TEXT,
      last_log_index INTEGER NOT NULL,
      PRIMARY KEY (term)
    );

## Code changes

- Remove "I am the sole source of truth" from Admin.
- Sync engine gains two paths: pull (from leader) and push (to quorum).
- Conflict resolution per command, declared as CRDT type.
- Outbox becomes Raft log.

## Backwards compatibility

- v1 Admin can read v2 projects (read-only until upgraded).
- v2 Admin can read v1 projects (read-only mode).
- Modules from v1 work in v2.
- Cloud API unchanged.

## Rollback

No rollback from v2 to v1. Restore from a pre-v2 backup into a new project if needed.

## Timeline

| Milestone | Date |
|---|---|
| v2 alpha | plus 6 months |
| v2 beta | plus 9 months |
| v2 GA | plus 12 months |
| v1 EOL | plus 18 months from v2 GA |

## What does not change

- Users are read-only.
- Module triple-signing.
- Own mesh (WireGuard plus mDNS plus discovery).
- Sync protocol is wire-compatible.
