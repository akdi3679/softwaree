# v1 Update System

The Cloud authors changes. The client applies them. The client is
always the writer. This is ADR-002 applied to updates.

## Five mechanisms

| # | Mechanism        | For                              | Touches data? |
|---|------------------|----------------------------------|---------------|
| 1 | Code update      | UI, logic, new pages, bug fixes  | No            |
| 2 | Schema migration | Add/change tables/columns        | Yes (additive)|
| 3 | Data patch       | Fix wrong rows                   | Yes (corrective)|
| 4 | Event rebuild    | Projection corruption            | Yes (re-derive)|
| 5 | Backup restore   | Disk loss, accidental delete     | Yes (restore) |

Mechanisms 1–3 are the update path. 4–5 are the recovery path. All
five are wired in v1.

## The apply pipeline (every mechanism)

1. Download signed artifact
2. Verify signature
3. Take pre-change backup (snapshot)
4. Acquire project lock (no new commands)
5. Apply in a single transaction
6. Verify post-state
7. Write audit entry
8. Release lock
9. On any failure: rollback, log, alert

## Adding / removing features

| Change                     | Mechanism          | Data       |
|----------------------------|--------------------|------------|
| New page                   | Code update        | No         |
| Remove a feature           | Code update + keep data (soft) | No |
| Remove a feature (hard)    | Code update + migration | Backup |
| New network method (mesh)  | Code update (additive layer below commands) | No |
| New module                 | Code update + bundle | No (new file) |
| Change ICMSF logic         | Code update        | No         |
| Add a field                | Code update + migration | Additive |
| Fix wrong verdicts         | Data patch         | Corrective |

Network methods are additive because the command layer never knows
*how* a User reached it — only *that* it did. Transport sits below
the command API.

## What the Cloud must NEVER do

- Silently rewrite client files
- Push unbounded SQL
- Drop tables
- Read outside the project
- Bypass signature verification

Data patches are: signed, versioned, show row counts in audit,
non-critical ones inspectable and refusable by the customer (audited),
critical ones deadline-enforced (Admin refuses to start if missed).

## The 5 wiring points (must exist in v1)

1. `tauri-plugin-updater` with signed bundles
2. Migration runner with pre-migration backup + rollback
3. Signed data-patch runner (versioned, transactional, audited,
   dry-run mode). Ships with zero patches.
4. `invoke('rebuild_projection')` — drops projection tables, replays
   events. Ships with a test.
5. `invoke('restore_from_backup', { blob_id })` — works on a fresh DB.

## The upgrade test

After any update, run `verify_audit_chain` and `rebuild_projection`.
Both must pass. If either fails, rollback.