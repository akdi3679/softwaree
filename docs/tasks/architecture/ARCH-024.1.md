# TASK ID: ARCH-024.1
# TITLE: Add architecture: final delivery checklist
# STATUS: pending
# DEPENDENCIES: CLOUD-026.2
# ALLOWED FILES: docs/architecture/CHECKLIST.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
What to verify before declaring v1 done.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/CHECKLIST.md`:

```markdown
# v1.0 Release Checklist

## Code

- [x] All micro-tasks completed (target: 920)
- [ ] All `cargo test` pass on Linux, macOS, Windows
- [ ] All `pnpm test` pass
- [ ] No `unsafe` in non-FFI code (cargo geiger)
- [ ] No `unwrap()` in production paths
- [ ] No `console.log` left over (use tracing)
- [ ] All TODOs have linked issues

## Security

- [ ] Pen-test report from third party
- [ ] Gitleaks clean
- [ ] cargo audit 0 high
- [ ] pnpm audit 0 high
- [ ] CSP headers set
- [ ] All endpoints require auth
- [ ] All modules triple-signed at install AND load
- [ ] All backups encrypted
- [ ] All sessions token-hashed in DB

## Performance

- [ ] Cold start < 1s on 4-year-old laptop
- [ ] p99 API < 200ms
- [ ] 1M event load test passed
- [ ] 100K concurrent users sync test passed
- [ ] Sustained 1K events/sec for 1 hour

## Reliability

- [ ] Chaos: power loss recovery
- [ ] Chaos: clock skew
- [ ] Chaos: malicious device rejected
- [ ] Chaos: corrupt SQLite recovery
- [ ] Chaos: network partition

## Compatibility

- [ ] Works on macOS 13+ (Intel + Apple Silicon)
- [ ] Works on Windows 10+ (x86 + ARM)
- [ ] Works on Ubuntu 22.04+ (x86 + ARM)
- [ ] Works on Fedora 40+ (x86 + ARM)
- [ ] Works on WireGuard 1.0+
- [ ] Works with Postgres 16
- [ ] Works with MinIO RELEASE.2024-09+

## Compliance

- [ ] HIPAA: encryption, audit, retention mapped
- [ ] GDPR: data export, deletion, sub-processors documented
- [ ] SOC 2: control matrix complete, audit started
- [ ] All third-party services listed (VENDORS.md)

## Documentation

- [x] Architecture overview
- [x] 12 non-negotiable principles
- [x] All ADRs
- [x] Sync protocol spec
- [x] Threat model
- [x] Customer FAQ
- [x] Module tutorial + cookbook
- [x] Runbooks
- [x] Release notes

## Operations

- [ ] 1 staging environment (Cloud, stage 0)
- [ ] 1 production environment (Cloud, stage 0)
- [ ] Backups verified: 3 successful consecutive runs
- [ ] Restore drill: 1 successful drill
- [ ] Monitoring: all 6 SLOs in dashboard
- [ ] On-call rotation set
- [ ] Status page live

## Launch

- [ ] Marketing site live
- [ ] 5 beta customers onboarded
- [ ] 1 case study
- [ ] Public blog post
- [ ] Press release drafted (NOT published)
- [ ] Support inbox monitored
- [ ] Founder available for the first 7 days

## Post-launch (within 30 days)

- [ ] NPS survey sent to all customers
- [ ] First retrospective
- [ ] Plan v1.1 based on feedback
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/CHECKLIST.md || { echo "FAIL"; exit 1; }
grep -q "v1.0" docs/architecture/CHECKLIST.md || { echo "FAIL"; exit 1; }
echo "OK"
```
