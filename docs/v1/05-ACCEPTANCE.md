# v1 Acceptance Criteria

v1 is correct when all 10 pass.

1. Local signup works offline. Cloud not required to start.
2. Create sample in UI → verify DB has 1 sample + 1 event + 1 audit,
   same tx.
3. Call `create_sample` twice with same idempotency key → still 3
   rows, not 6.
4. Kill Admin mid-transaction → on restart, no partial state: no
   event without data, no data without event.
5. Tamper one audit row → `verify_audit_chain` fails and names the
   broken sequence.
6. `rebuild_projection` → drop projection tables, replay events,
   projection matches pre-rebuild state exactly.
7. Cloud down → app works fully; license refresh and backup pause;
   after 7-day grace, read-only (view + print, no writes).
8. Restore from backup into a fresh DB → same state as backup
   snapshot, audit chain intact.
9. Module tamper (flip one byte in the signed bundle) → refuse to
   load, log security event.
10. Full lab workflow: intake → tests → results → ICMSF verdict →
    report → PDF → print, all correct against the existing
    food-analyse behavior.

## The upgrade test (must pass)

v1.1 (User app) can read v1's event log and produce a correct
projection without a data migration. If it can't, v1 is not a true
subset — fix v1 before shipping.