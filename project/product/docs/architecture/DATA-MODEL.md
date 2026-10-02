# Data model overview

Three tiers of data, each with a clear owner.

## Tier 1 - Cloud control plane (Postgres)

Owned by us. Contains:
- accounts: account identity, email, plan, region, Stripe IDs
- users: humans, many per account
- devices: device registrations with public keys
- sessions: auth sessions
- projects: project metadata only (no business data)
- memberships: user to project plus role
- invitations: pending invites
- modules / module_versions: module registry
- plans / plan_subscriptions: plan catalog plus active subs
- audit_entries: Cloud-only audit (not business audit)
- backups: encrypted backup metadata (blob in MinIO)
- jobs: background job queue
- email_verifications: signup verification tokens
- module_publishers: third-party publishers
- stripe_events: idempotency table for webhooks
- cluster_nodes: Cloud instance heartbeat
- account_locks: brute-force lockouts
- device_discovery: public IP metadata (no content)

Never stores: patient data, sample data, appointments, business events.

## Tier 2 - Admin project data (SQLite, per project)

Owned by the customer. Contains:
- events: append-only business event log
- outbox: pending events for delivery
- audit_entries: hash-chained business audit
- users: project users (mirrors Cloud identity, has role)
- roles / role_permissions / user_roles
- invitations: local invitation records
- idempotency_keys: command dedupe
- notifications: in-app notifications
- push_subscriptions: browser push subscriptions
- schema_version: per-project schema version

Never leaves the Admin device unencrypted. Backups are encrypted before upload.

## Tier 3 - User projection (SQLite, per user)

Owned by the User. Contains:
- projection_state: cursor (last_applied_sequence)
- projection_events: raw events delivered from Admin
- projection_users: user list projection
- projection_roles: role list projection
- projection_audit: audit summary
- search_index: FTS5 index over projected data
- per_table_cursor: per-aggregate-type cursor

Rebuildable from Admin events. Disposable.

## Ownership rules

| Datum | Owner |
|---|---|
| Account | Cloud |
| Project metadata | Cloud |
| Business events | Admin |
| Business projections | User |
| Audit (business) | Admin |
| Audit (Cloud) | Cloud |
| Backups | Cloud (encrypted) |
| Module registry | Cloud |
| Device identity | Cloud (public) plus Device (private) |
| Discovery metadata | Cloud |

## What lives where at runtime

- Write goes to Admin SQLite only.
- Read on User is local (projection).
- Cloud is consulted for auth, billing, module install, backup upload.
- Never does Cloud see business data.