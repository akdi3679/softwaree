
05-ACCEPTANCE.md

# v1 Acceptance Criteria

**Status:** Locked
**Amended:** review pass 2 — Test #1 clarifies module activation (bootstrap
deferred), several new tests added (encryption at rest, anchor survives
restore, migration failure, sandbox isolation, recovery ceremony, export
in every state), the gate is now tests 6, 8, 11, 17. Total: **28 tests**.

v1 is correct when all tests pass. Each one is an automated test or a
documented manual run, not a claim.

## Platform correctness

1. **Offline start.** Local signup, key generation and first project creation
   work with no network. The Cloud is never required to create the project or
   open it. **The food-lab module requires one online activation** — v1-foodlab
   ships no embedded bootstrap bundles. This is a documented, deliberate
   deviation from big-doc ADR-023, recorded in `v1/DEVIATIONS.md`. Until
   activation the shell runs and the project is readable; module pages show
   "Activate to begin", and export of anything already present still works.

2. **Atomic quintuple.** Creating a sample in the UI produces exactly
   1 sample row + 1 event + 1 audit entry + 1 outbox row + 1 command_log
   row, in one transaction.

3. **Idempotency.** `create_sample` twice with the same idempotency key
   leaves the row counts unchanged and returns the stored result payload.
   Two concurrent identical calls also produce one row. Same key with
   a different payload → `IdempotencyConflict`.

4. **Crash safety.** Kill the process mid-transaction. On restart there is
   no event without data and no data without event.

5. **Tamper evidence.** Modify one audit row directly. `verify_audit_chain`
   fails and names the broken `audit_seq`.

6. **Rebuild-and-diff (the upgrade test).** Replay `events` through
   `apply_event` into a scratch database. Every **projected business
   table** (table classes defined in `02-DATA-MODEL.md`) matches the
   live database exactly. This proves v1 is a true subset of the final
   architecture and that v1.1 needs no data migration. The scratch database is created by running the same migration scopes, then replaying events. Reference data created by initialise must be present after replay.

## Custody and recovery

7. **Cloud offline.** With the Cloud unreachable, all local work continues.
   After the **14-day grace** the app is read-only: browse, view, print,
   **take local backup, verify audit chain, and export** work; every
   write command is refused, including restore from corbeille.

8. **Restore into a fresh DB.** `restore_from_backup` on an empty database
   reproduces the snapshot state with an intact audit chain. **The
   erasure ledger is re-applied before the project becomes writable.**
   Then run the full "laptop dies" flow: new device, 2FA, 48-hour wait,
   alerts, quorum approval, HSM re-wraps Backup Key to new device's
   X25519 key, download, restore, re-issued bundles. A test-only config may shorten the 48-hour wait on a non-production Cloud; the production build must refuse it.
   
9. **Clock tampering.** Set the system clock backwards. The license grace
   period does not extend. The monotonic anchor never moves back.

10. **Anchor survives restore.** Restore an old backup (created before a
    license renewal) on the same device. The `license_state` table in
    `admin_state.db` is unchanged (it lives outside `project.db`). The
    grace period does not extend based on the restored data.

11. **Recovery ceremony gating.** Initiate recovery with only one staff
    approval → action blocked. Initiate and approve as the same person →
    refused. Initiate without 2FA → refused. Before 48 hours elapsed →
    blocked. Customer clicks the cancel link in the alert email → action
    aborted and audited. Solo-owner mode (`approvals_required = 1`) →
    requires hardware key, 24-hour delay, and alert; cannot be bypassed.

## Payment gate

12. **Bundle tamper.** Flip one byte in the signed bundle (manifest,
    binary, UI, or migrations). The app refuses to load it and logs a
    security event.

13. **Device binding.** Copy a valid bundle to a second device. It refuses
    to load: `device_bind` signature check fails AND decryption of
    `binary.wasm.enc` fails (Content Key wrapped to the original device's
    X25519 key). This is the test that proves the subscription cannot be
    shared.

14. **Expiry and renewal.** Let the license expire → read-only. Renew →
    writes re-enabled without reinstalling anything.

## Domain correctness

15. **ICMSF parity.** For a fixture set covering `presence_absence`,
    `two_class`, `three_class` and `custom`, and result types numeric,
    `<`, `>`, ND, detected, TNTC, the Rust `compute_verdict` produces the
    same verdicts as the existing food-analyse app. `limit_snapshot`
    contains every required field including `rule_version`.

16. **Correction, not rewrite.** Correct a result that belongs to a signed
    report. The original result and the original report PDF (BLOB in DB)
    are unchanged; a new result with `correction_of` and a new report with
    `supersedes` exist; the old report's status is `superseded`; the audit
    chain records both events. **A result listed in `included_results` of
    any signed report has `is_in_signed_report = 1`: it cannot be mutated
    in place and cannot be recomputed by a `recompute_derived` patch.**
    Correction by new row is the only permitted path, and is exactly what
    this test exercises. An attempt to patch it is refused and audited.

## Security and isolation

17. **Encryption at rest (DB, backup, PDFs).**
    - A copy of `project.db` opened with a different DB Key fails at open.
    - `keyring.enc` on disk is ciphertext without the keychain entry.
    - A backup archive opened without the Backup Key fails.
    - A backup archive byte scan finds no plaintext SQLite page.
    - A PDF stored in `mod_food_lab_reports.pdf_blob` is not readable
      without opening the DB with the right key.
    - No code path calls Argon2 on the **account password** and uses the
      output as key material (CI grep for `argon2` in any module touching
      encryption). Argon2id on a **backup passphrase** is required and
      permitted (local-only backups, Phase 7). The two are separate
      functions with distinct input types.
    - No code path calls HKDF with an Ed25519 key as input.

18. **Migration-failure restore.** Induce a migration failure mid-apply
    (e.g., a CHECK constraint violation in a backfill). The pre-migration
    snapshot is restored automatically. `schema_version` is unchanged.
    The project opens normally on next launch.

19. **Sandbox isolation (Phase 6b).** From inside the module iframe:
    - `fetch('https://attacker.com')` → blocked by CSP, logged.
    - `localStorage.setItem(...)` → throws (opaque origin).
    - `window.parent.document` → inaccessible (opaque origin).
    - `postMessage` with a forged session token → rejected by host.
    - `postMessage` from a different window → rejected by `event.source`
      check.
    - `postMessage` with an undeclared method → rejected.
    - `postMessage` with a raw SQL string in a filter payload → rejected.

20. **Typed-op compiler enforcement.** A data patch with a `set_field` op
    targeting the `events` table → rejected at dry run. Same op targeting
    `audit_entries`, `command_log`, `resource_keys`, `schema_version`,
    or another module's table → rejected. Only `mod_food_lab_*` tables
    are reachable. Dry run shows SQL and row counts; refusal is audited.

21. **Export in every licence state.** The Admin can export the full
    project (JSON + CSV + PDF) in each of: active licence, grace period,
    read-only (post-grace), restricted mode (critical-update deadline
    passed), unactivated (no licence row yet; bootstrap bundles are deferred — DEVIATIONS §1), and licence-expired. The export
    is identical in content across all states. Principle 14 verified.

## Replay and event integrity

22. **Replay version pinning.** An event with `module_version = 1.0.0`
    replayed through the recorded module build produces identical rows.
    Replay through a missing build with no declared upcaster → loud
    failure, not silent drift.

23. **Eviction emits an event.** Quota eviction emits `tombstone.purged`
    through `apply_event`; a silent `DELETE` on a Projected table makes
    rebuild-and-diff diverge. (`resource.erased` has no v1 command; its
    handler is exercised by a fixture ledger row in test 8. See
    DEVIATIONS §7.)

24. **`is_in_signed_report` flag.** When a `report.signed` event lists a
    result id, that result's `is_in_signed_report` is set to 1 by
    `apply_event`. The flag is writeable only by `apply_event`; no command
    or patch sets it directly.
25. **Contact cooling-off.** Add a contact, change the password, then start a recovery within 7 days: the new contact is not yet active; every original contact and the signup email are alerted; removing the signup email is refused; the cancel link aborts the case and audits it.

26. **State tamper and new device.** Roll `admin_state.db` back to an older copy, or delete it while the keychain mirror remains → read-only immediately. On a device with neither file nor keychain key → read-only until first Cloud contact, anchor seeded from the signed Cloud time. An offline activation file older than 7 days is refused as an anchor source.

27. **Corbeille lifecycle.** Delete a draft report → tombstone written and live row removed through an event; restore → row returns through an event; delete a company that has samples → refused; lower the licence-carried quota in a fixture → oldest tombstone evicted through `tombstone.purged`; try to delete a result or a signed report → refused. Rebuild-and-diff still matches.

28. **Activation gate.** Before activation: module pages show "Activate to begin", the module's `initialise` command has not run (no reference data exists), export works. Activation requires a verified second factor. After activation and module install: `initialise` has emitted the seed events, and test 6 still passes.


## The gate

**Tests 6, 8, 11, and 17 are the four that decide whether v1 can grow
and can be trusted.**

- **If 6 fails**, v1 is a different architecture and will be rewritten.
- **If 8 fails**, the recovery promise is false; customers will lose data.
- **If 11 fails**, the recovery ceremony is theatre; social engineering
  wins.
- **If 17 fails**, the security model is false; a stolen disk or backup
  is readable.

Do not ship with any of these four failing. The other tests are required
but these four are the gates.
