# TASK ID: LAUNCH-018.1
# TITLE: Add module review checklist (ops)
# STATUS: pending
# DEPENDENCIES: LAUNCH-017.2
# ALLOWED FILES: docs/marketplace/REVIEW-CHECKLIST.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Step-by-step checklist for our ops team to review a module submission.

## REQUIRED IMPLEMENTATION

Create `docs/marketplace/REVIEW-CHECKLIST.md`:

```markdown
# Module Review Checklist

Used by the ops team when a publisher submits a new module or version.

## Pre-review (5 min)

- [ ] Pull the manifest
- [ ] Verify the publisher identity (we have KYC for publishers)
- [ ] Check the publisher's track record (any previous rejections?)
- [ ] Read the description, check for spam / misleading claims

## Automated checks (5 min)

- [ ] All three signatures valid (cloud_root, project_license, device_bind)
- [ ] Manifest schema valid (our Zod schema)
- [ ] WASM binary is real (not a polyglot)
- [ ] No dangerous scopes (network_egress, filesystem_write, spawn_subprocess) without justification
- [ ] File size < 5 MB
- [ ] No embedded executables (we extract and check)

## Manual review (30 min)

- [ ] Install in a sandbox project
- [ ] Run every command documented in the README
- [ ] Verify each event_type makes sense for the data
- [ ] Test idempotency (call same command twice → same result)
- [ ] Test concurrency (10 concurrent calls → no broken state)
- [ ] Test error handling (invalid input → graceful error, not panic)
- [ ] Look at the audit log: are events being written correctly?
- [ ] Look at the SQLite: are tables + indices correct?
- [ ] Test uninstall: clean up?
- [ ] Test upgrade (old version → new version): data preserved?

## Documentation review (10 min)

- [ ] README is clear
- [ ] Every command has an example payload
- [ ] Every event_type is documented
- [ ] Error cases are documented
- [ ] Permissions are documented

## Decision

- [ ] Approve and publish
- [ ] Reject (with reason: ___)
- [ ] Request changes (specific list: ___)

## After approval

- [ ] Notify publisher
- [ ] Module is now in the marketplace
- [ ] Monitor first 100 installs for issues
- [ ] After 30 days, schedule a re-check

## SLA

- Initial review: 5 business days
- Re-review after changes: 2 business days
```

## TESTS

```bash
cd /workspace
test -f docs/marketplace/REVIEW-CHECKLIST.md || { echo "FAIL"; exit 1; }
grep -q "Review" docs/marketplace/REVIEW-CHECKLIST.md || { echo "FAIL"; exit 1; }
echo "OK"
```
