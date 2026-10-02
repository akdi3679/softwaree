# Migrations

How we evolve the platform without breaking data.

## Migration types

| Type | What | How |
|---|---|---|
| Schema (DDL) | Add column, add table | migrations/000X_name.sql |
| Data (DML) | Backfill, transform | migrations/000X_name.sql plus script |
| Code | Business logic | New binary; no migration |
| Module | Module upgrade | Re-publish in Cloud; Admin downloads |
| Event schema | Bump schema_version | New event shape; upgrader at read time |
| Role | New built-in role | Add to seed; runs on next Admin start |
| Permission | New permission on a role | Add to seed |

## Schema migrations

Both Cloud (Postgres) and Admin/User (SQLite) use numbered SQL:

    migrations/
      0001_core.sql
      0002_outbox.sql
      ...

Each runs inside a transaction. Failure equals rollback, no partial state.

## Up and down

Every migration has both. Example:

    0003_modules.up.sql
      CREATE TABLE modules (...);

    0003_modules.down.sql
      DROP TABLE modules;

Down is used on rollback. Both paths are tested in CI.

## Data migrations

Backfills are idempotent. Example:

    INSERT INTO audit_entries (occurred_at, action, prev_hash, entry_hash)
    SELECT datetime(now), chain.backfilled, 000...000, placeholder
    WHERE NOT EXISTS (SELECT 1 FROM audit_entries WHERE action = chain.backfilled);

Running twice produces the same result.

## Code migrations

Changing event shape:

1. Bump schema_version.
2. Old events with schema_version 1 upgrade at read time.
3. New events written with schema_version 2.
4. After 30 days, drop the upgrade code.

## Module migrations

1. Publisher uploads a new version.
2. Cloud signs and publishes.
3. Admin sees update available.
4. Admin updates at their pace.
5. Old module events remain readable.

## Event schema migrations

Events are versioned. schema_version 1 upgraded to 2 at read time by pure functions.

## Risk mitigation

- Backup before migrate.
- Smoke test after migration.
- Every migration has a down.
- Canary: 1 to 10 to 100 percent of Admins.

## What we do not migrate

- Audit log entries (immutable).
- Encrypted backup contents (decrypt with old key, then re-encrypt).
- SQLite from very old versions (customer re-onboards).
