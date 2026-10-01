# TASK ID: ARCHITECTURE-002.2
# TITLE: Add 06-MIGRATIONS (data migration strategy)
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-002.1
# ALLOWED FILES: /workspace/docs/architecture/06-MIGRATIONS.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document how data migrations are handled — schema, data, code, modules.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/06-MIGRATIONS.md`:

```markdown
# Migrations

How we evolve the platform without breaking existing data.

## Migration types

| Type | What | How |
|------|------|-----|
| Schema (DDL) | Add column, add table | `migrations/000X_name.sql` |
| Data (DML) | Backfill, transform | `migrations/000X_name_data.sql` + script |
| Code | Change business logic | New version of the binary, no migration |
| Module | Module upgrade | Re-publish in Cloud; Admin downloads |
| Event schema | Bump `schema_version` on an event type | New event with `schema_version: 2` |
| Role | Add a new built-in role | Add to seed; existing projects don't get the role automatically |
| Permission | Add a permission to a role | Add to seed; runs on each Admin's next start |

## Schema migration

Both Cloud (Postgres) and Admin (SQLite) use numbered SQL migrations:

```bash
migrations/
  0001_initial.sql
  0002_outbox.sql
  0003_modules.sql
```

Each migration is wrapped in a transaction. The migration is run forward; if it fails, we roll back.

## Up and down

Every migration has both up and down:

```sql
-- 0003_modules.up.sql
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ...
);

-- 0003_modules.down.sql
DROP TABLE modules;
```

The down is run on rollback. We test both in CI.

## Data migration

Some changes need a backfill:

```sql
-- 0004_backfill_audit_chain.up.sql
-- For all existing projects, compute the audit chain
INSERT INTO audit_entries (occurred_at, action, prev_hash, entry_hash)
SELECT
  datetime('now'),
  'chain.backfilled',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'placeholder'
;
```

The data migration is idempotent. Running it twice produces the same result.

## Code migration

For example, changing the way an event is constructed:

1. Bump the `schema_version` in the event
2. Old events with `schema_version: 1` are upgraded at read time
3. New events are written with `schema_version: 2`
4. After 30 days, drop the upgrade code

## Module migration

When a module is updated:

1. Publisher uploads a new version to the Cloud
2. Cloud signs and publishes
3. Admin sees an "Update available" notification
4. Admin chooses when to update
5. The new module is installed (in addition to the old, until the Admin removes the old)
6. Events from the old module are still readable

## Event schema migration

Events are versioned. An event with `schema_version: 1` is upgraded to `schema_version: 2` at read time. The upgraders are pure functions, easy to test.

## Risk mitigation

- **Backup before migrate**: Every schema migration runs AFTER a successful backup
- **Smoke test**: After migration, run a smoke test
- **Rollback plan**: Every migration has a `down`
- **Canary**: New code is released to 1% of Admins first, then 10%, then 100%

## What we don't migrate

We don't migrate:
- Audit log entries (immutable)
- Encrypted backup contents (decrypt with old key first, if needed)
- Customer's SQLite from a much older version (they must re-onboard)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/06-MIGRATIONS.md || { echo "FAIL"; exit 1; }
grep -q "Migration types" docs/architecture/06-MIGRATIONS.md || { echo "FAIL"; exit 1; }
echo "OK"
```
