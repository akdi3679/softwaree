# Module Review Checklist

Used by ops when a publisher submits a new module or version.

## Pre-review (5 min)

- [ ] Pull the manifest
- [ ] Verify the publisher identity (KYC on file)
- [ ] Check publisher track record (previous rejections?)
- [ ] Read description, check for spam or misleading claims

## Automated checks (5 min)

- [ ] All three signatures valid (cloud_root, project_license, device_bind)
- [ ] Manifest schema valid
- [ ] WASM binary is real (not a polyglot)
- [ ] No dangerous scopes (network_egress, filesystem_write, spawn_subprocess) without justification
- [ ] File size under 5 MB
- [ ] No embedded executables

## Manual review (30 min)

- [ ] Install in a sandbox project
- [ ] Run every command documented in the README
- [ ] Verify each event_type makes sense for the data
- [ ] Test idempotency (same command twice, same result)
- [ ] Test concurrency (10 concurrent calls, no broken state)
- [ ] Test error handling (invalid input, graceful error not panic)
- [ ] Look at the audit log: events written correctly?
- [ ] Look at SQLite: tables and indices correct?
- [ ] Test uninstall: clean up?
- [ ] Test upgrade (old to new version): data preserved?

## Documentation review (10 min)

- [ ] README is clear
- [ ] Every command has an example payload
- [ ] Every event_type is documented
- [ ] Error cases are documented
- [ ] Permissions are documented

## Decision

- [ ] Approve and publish
- [ ] Reject (with reason)
- [ ] Request changes (specific list)

## After approval

- [ ] Notify publisher
- [ ] Module is now in the marketplace
- [ ] Monitor first 100 installs for issues
- [ ] After 30 days, schedule a re-check

## SLA

- Initial review: 5 business days
- Re-review after changes: 2 business days