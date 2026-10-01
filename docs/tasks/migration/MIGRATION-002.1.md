# TASK ID: MIGRATION-002.1
# TITLE: Add migration: v2 schema preview
# STATUS: pending
# DEPENDENCIES: SECURITY-006.2
# ALLOWED FILES: docs/migration/V2-SCHEMA.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document v2 schema changes.

## REQUIRED IMPLEMENTATION

Create `docs/migration/V2-SCHEMA.md`:

```markdown
# v2 Schema Preview (NOT YET RELEASED)

## Goals

- Multi-Admin per project (Raft/CRDT)
- Offline writes with conflict resolution
- Rich media (larger attachments, video clips)
- Hierarchical roles (org → project → team)
- Global search across projects (Cloud indexed)

## Breaking changes

### Identifiers

- v1: `proj_<22 base32>`
- v2: `proj_<22 base32>` (same format) — *no change*

### Event payload

- v1: flat JSON
- v2: includes `schema_version` and `previous_event_id` for chain integrity

### New fields in `events` table

```sql
ALTER TABLE events ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN previous_event_id TEXT;
ALTER TABLE events ADD COLUMN migration_run_id TEXT;
```

### New tables

```sql
CREATE TABLE offline_operations (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL,
  payload BLOB NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  conflict_state TEXT  -- "none" | "needs_merge" | "needs_user_input"
);

CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE org_memberships (
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (org_id, user_id)
);
```

## Migration script (v1 → v2)

1. Read all v1 events
2. For each: add `schema_version = 1` (so v2 readers know it's legacy)
3. Add `previous_event_id` by reading `prev_hash` and looking up the matching event
4. Wrap in a v2 migration envelope
5. Replay into the new v2 schema (Drizzle `applyMigration`)

## Compatibility

v2 clients can read v1 events (they just see schema_version=1 and ignore
the missing fields). v1 clients cannot read v2 events.

## When

- v1 ships Q1 2027
- v2 ships Q1 2028 (if at all; depends on customer demand)
- v1 will be supported through Q1 2030 (3 years)

## Action required

- Plan your event types to be forward-compatible
- Don't add fields with empty/null values to the payload if you can avoid it
- Document any custom event types in `docs/events/CUSTOM.md`
```

## TESTS

```bash
cd /workspace
test -f docs/migration/V2-SCHEMA.md || { echo "FAIL"; exit 1; }
grep -q "v2" docs/migration/V2-SCHEMA.md || { echo "FAIL"; exit 1; }
echo "OK"
```
