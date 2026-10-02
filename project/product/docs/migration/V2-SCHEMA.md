# v2 Schema Preview (NOT YET RELEASED)

## Goals

- Multi-Admin per project (Raft, CRDT)
- Offline writes with conflict resolution
- Hierarchical roles (org, project, team)
- Global search across projects

## Identifiers

Same format: proj_<22 base32>. No change.

## Event payload

v1: flat JSON.
v2: adds schema_version and previous_event_id.

## New fields on events

    ALTER TABLE events ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE events ADD COLUMN previous_event_id TEXT;
    ALTER TABLE events ADD COLUMN migration_run_id TEXT;

## New tables

    CREATE TABLE offline_operations (
      id TEXT PRIMARY KEY,
      command_id TEXT NOT NULL,
      payload BLOB NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      conflict_state TEXT
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

## Migration script (v1 to v2)

1. Read all v1 events.
2. Set schema_version = 1 on each.
3. Fill previous_event_id by looking up prev_hash.
4. Wrap in a v2 migration envelope.
5. Replay into new schema.

## Compatibility

v2 reads v1 events (upgrade at read time).
v1 cannot read v2 events.

## Timeline

- v1 ships Q1 2027
- v2 ships Q1 2028 (if demand)
- v1 supported through Q1 2030

## Action required

- Design event types forward-compatible.
- Avoid empty or null fields in payloads.
- Document custom event types in docs/events/CUSTOM.md.
