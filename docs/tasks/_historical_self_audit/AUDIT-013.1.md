# TASK ID: AUDIT-013.1
# TITLE: Self-audit fix #9: ADR-016 one Admin per project (formalize)
# STATUS: pending
# DEPENDENCIES: AUDIT-012.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-016-one-admin.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User confirmed: one Admin per project. Document it as a formal ADR
so future engineers know it's deliberate.

## WHY THIS WAS FOUND IN SELF-AUDIT
This is a major architectural decision that should be explicit, not
implied. Anyone joining the team should understand why.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-016-one-admin.md`:

```markdown
# ADR-016: One Admin Per Project (Confirmed)

## Status
Accepted, 2026-08-09 (confirmed by user)

## Context

We made the decision early on: one project = one Admin device.

This is unusual. Most tools allow multiple admins. We need to be
explicit about:

1. Why we chose this
2. What the trade-offs are
3. When we'll revisit it

## Decision

**One project has exactly one Admin device at any time.**

The Admin is the source of truth. It holds the project key. It
appends events to the event store. It signs every command.

Other users in the project (the staff) are **Users**. They have
read access (User app) and can submit commands, but those commands
are processed by the Admin. Users are NOT admins.

## Why we chose this

### 1. Simplicity
- No conflict resolution
- No merge logic
- No "who wins" questions
- One audit chain, no forks
- One truth, everywhere

### 2. Clear ownership
- Every project has a single human responsible for it
- "Who has the keys?" has exactly one answer
- Easy to reason about for compliance (HIPAA: who is the custodian?)

### 3. Faster development
- v1 ships in 10 weeks, not 10 months
- v2 can add multi-Admin with proper conflict resolution
- Linear spent 2 years on their sync; we don't have 2 years

### 4. Real-world fit
- Most clinics have 1 IT-savvy person (the doctor, the manager)
- That person runs the Admin
- Staff don't need Admin
- 90% of our use cases fit this model

## Trade-offs

### What this prevents

❌ Two people writing to the same project simultaneously from Admin
❌ Multiple devices acting as Admin
❌ Offline-then-sync from multiple Admin devices
❌ Multi-Admin in v1 (planned for v2, 2028)

### What this requires

- The Admin must be reliable (we recommend a desktop, not a phone)
- The Admin's user is responsible for the project
- If Admin is unavailable for 2 weeks, no one can write
- Customers must accept this trade-off (and many will, document it clearly)

## What happens when the Admin is replaced

See ADR-012 (Backup Key Escrow).

The flow:
1. Old Admin (or any authorized user) initiates replacement
2. Cloud verifies the request
3. Old Admin's wrapped key is destroyed
4. New Admin's keypair is registered
5. Project key is re-wrapped to new Admin's pubkey
6. New Admin takes over (no data loss)
7. Audit log records the full chain

## What happens when the Admin is offline

**v1**: No writes. Users can read (User app subscribes to cached events).
This is documented and customers accept it.

**v2 (planned)**: Optional offline write queue. Users can submit commands
to a User-side queue. When Admin comes back online, commands replay in
order. This requires careful conflict resolution (CRDT-like).

## When to revisit (v2)

- If customers consistently complain about Admin-unavailable problem
- If we have 100+ customers asking for multi-Admin
- If we have engineering capacity (1+ FTE for 6+ months)

For v2, multi-Admin would be implemented as:
- Multiple Admin devices, all holding wrapped copy of project key
- Each appends events with their own device signature
- Conflict resolution: last-write-wins for same field, with full audit
- Or: CRDT-based, no conflicts by design (more work)

## Communicating this to customers

- Marketing: "One source of truth. Always."
- Documentation: "The Admin is the custodian of your data"
- Sales: "If your Admin goes on vacation, your staff can still read all
  records and use the system normally. Only writes pause."
- Status page: shows when the Admin was last seen

## Confirmation

This was explicitly confirmed by the user on 2026-08-09:

> "yes on admin per project"

We treat this as a locked decision for v1 and v2.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-016-one-admin.md || { echo "FAIL"; exit 1; }
grep -q "One Admin" docs/architecture/02-DECISIONS/ADR-016-one-admin.md || { echo "FAIL"; exit 1; }
echo "OK"
```
