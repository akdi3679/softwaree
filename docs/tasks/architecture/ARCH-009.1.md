# TASK ID: ARCH-009.1
# TITLE: Add architecture: glossary
# STATUS: pending
# DEPENDENCIES: MODULE-007.2
# ALLOWED FILES: docs/architecture/GLOSSARY.md
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every term defined in one place.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/GLOSSARY.md`:

```markdown
# Glossary

## Actors

- **Admin** — The single source of truth for project data. Runs the Admin Tauri app.
- **User** — Read-only viewer; runs the User Tauri app.
- **Publisher** — Third-party developer who publishes modules to the marketplace.
- **Customer** — The organization that owns the account (e.g., a clinic).
- **Operator** — Our internal team (we run the Cloud platform).

## Concepts

- **Project** — One customer's data silo. Has exactly one Admin device, may have many Users.
- **Module** — A WASM blob that extends the system. Triple-signed.
- **Command** — A request to change state. Always goes through the Admin.
- **Event** — A fact that happened. Append-only. Hash-chained.
- **Projection** — A read-optimized view of the event stream. Lives on every device.
- **Outbox** — Pending commands waiting to be dispatched.
- **Sync** — The protocol Admin uses to push events to Users.
- **Snapshot** — A full projection dump, sent when a User is too far behind.
- **Backup** — An encrypted blob of a project's SQLite + events, uploaded to Cloud.
- **Tailnet** — A our mesh. We use two: project + ops.
- **Discovery service** — our self-hosted mesh in our Cloud.
- **Our mesh device** — Any device with our WireGuard mesh client. Identified by 10.50.0.x IP (per project).

## Plans

- **LOCAL** — Free, single Admin, no Users, no backups.
- **STARTER** — $29/mo, 1 project, 3 users, weekly backups.
- **TEAM** — $99/mo, 5 projects, 10 users, daily backups.
- **ENTERPRISE** — $499+/mo, unlimited, custom modules, multi-Admin, 4h backups.

## Status enums

- **ProjectState**: `active`, `suspended`, `archived`
- **DeviceState**: `pending`, `active`, `revoked`, `replaced`
- **ModuleState**: `pending`, `verified`, `installed`, `disabled`, `uninstalled`
- **MembershipState**: `active`, `pending`, `removed`
- **BackupState**: `pending`, `in_progress`, `completed`, `failed`, `expired`

## Error categories

- `auth` — Authentication failed.
- `forbidden` — Authenticated but not allowed.
- `not_found` — Resource doesn't exist.
- `validation` — Input invalid.
- `conflict` — Optimistic concurrency conflict.
- `rate_limited` — Too many requests.
- `protocol` — Sync protocol error.
- `internal` — Unexpected server error.
- `crypto` — Cryptography operation failed.

## Event types

See `product/contracts/src/events.ts` for the canonical list. Common ones:
- `account.created`, `account.deleted`
- `device.added`, `device.revoked`, `device.replaced`
- `project.created`, `project.archived`
- `user.invited`, `user.joined`, `user.removed`, `user.role_changed`
- `module.installed`, `module.uninstalled`
- `backup.completed`, `backup.failed`
- (module-specific) `patient.created`, `appointment.scheduled`, etc.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/GLOSSARY.md || { echo "FAIL"; exit 1; }
grep -q "Admin" docs/architecture/GLOSSARY.md || { echo "FAIL"; exit 1; }
echo "OK"
```
