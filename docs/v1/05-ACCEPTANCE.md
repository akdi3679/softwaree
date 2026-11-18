# v1 Acceptance Criteria

v1 is correct when all 14 pass. Each one is an automated test or a
documented manual run, not a claim.

## Platform correctness

1. **Offline start.** Local signup and first project creation work with
   no network. The Cloud is never required to start the app.

2. **Atomic triple.** Creating a sample in the UI produces exactly
   1 sample row + 1 event + 1 audit entry + 1 outbox row, in one
   transaction.

3. **Idempotency.** `create_sample` twice with the same idempotency key
   leaves the row counts unchanged and returns the stored result payload.
   Two concurrent identical calls also produce one row.

4. **Crash safety.** Kill the process mid-transaction. On restart there is
   no event without data and no data without event.

5. **Tamper evidence.** Modify one audit row directly. `verify_audit_chain`
   fails and names the broken `audit_seq`.

6. **Rebuild-and-diff (the upgrade test).** Replay `events` through
   `apply_event` into a scratch database. Every domain table matches the
   live database exactly. This proves v1 is a true subset of the final
   architecture and that v1.1 needs no data migration.

## Custody and recovery

7. **Cloud offline.** With the Cloud unreachable, all local work continues.
   After the 7-day grace the app is read-only: browse, view and print
   existing reports work; every write command is refused.

8. **Restore into a fresh DB.** `restore_from_backup` on an empty database
   reproduces the snapshot state with an intact audit chain. Then run the
   full "laptop died" flow: new device, escrow release, re-wrap, download,
   restore, re-issued bundles.

9. **Clock tampering.** Set the system clock backwards. The license grace
   period does not extend. The monotonic anchor never moves back.

## Payment gate

10. **Bundle tamper.** Flip one byte in the signed bundle. The app refuses
    to load it and logs a security event.

11. **Device binding.** Copy a valid bundle to a second device. It refuses
    to load: `device_bind` fails. This is the test that proves the
    subscription cannot be shared.

12. **Expiry and renewal.** Let the license expire → read-only. Renew →
    writes re-enabled without reinstalling anything.

## Domain correctness

13. **ICMSF parity.** For a fixture set covering `presence_absence`,
    `two_class`, `three_class` and `custom`, and result types numeric,
    `<`, `>`, ND, detected, TNTC, the Rust `compute_verdict` produces the
    same verdicts as the existing food-analyse app. `limit_snapshot`
    contains every required field including `rule_version`.

14. **Correction, not rewrite.** Correct a result that belongs to a signed
    report. The original result and the original report PDF are unchanged;
    a new result with `correction_of` and a new report with `supersedes`
    exist; the old report's status is `superseded`; the audit chain records
    both events.

## The gate

Test **6** and test **11** are the two that decide whether v1 can grow.

- If 6 fails, v1 is a different architecture and will be rewritten.
- If 11 fails, v1 has no payment gate.

Do not ship with either failing.