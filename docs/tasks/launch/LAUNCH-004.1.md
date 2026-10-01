# TASK ID: LAUNCH-004.1
# TITLE: Add pen-test report template
# STATUS: pending
# DEPENDENCIES: LAUNCH-003.2
# ALLOWED FILES: docs/security/PEN-TEST-FINDINGS.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When pen-test is done, drop findings into this file. Tracked + closed.

## REQUIRED IMPLEMENTATION

Create `docs/security/PEN-TEST-FINDINGS.md`:

```markdown
# Pen-test Findings

| Date | Vendor | Scope | Report |
|---|---|---|---|
| TBD | Trail of Bits (proposed) | Full platform | [link] |

## Active findings

| ID | Severity | Title | Status | Owner | Due |
|---|---|---|---|---|---|
| (none yet) | | | | | |

## Severity definitions

- **Critical**: Active exploit; data at risk. Fix within 24h.
- **High**: Exploitable with conditions. Fix within 7 days.
- **Medium**: Vulnerability that requires significant effort. Fix within 30 days.
- **Low**: Hardening opportunity. Fix within 90 days.
- **Info**: Note for awareness. No fix required.

## Status values

- **Open**: Confirmed, not fixed.
- **In progress**: Fix being written.
- **Fixed**: Code merged, awaiting re-test.
- **Verified**: Pen-tester confirmed fix.
- **Won't fix**: Documented reason, customer notified if material.
- **Duplicate**: Same as another finding.

## Re-test

Every Critical/High requires re-test within 30 days.
Add the re-test result to the original finding.

## SLA

| Severity | Time to fix | Re-test |
|---|---|---|
| Critical | 24h | 7 days |
| High | 7 days | 30 days |
| Medium | 30 days | 60 days |
| Low | 90 days | 90 days |

## Pre-test checklist (for the auditor)

Before the pen-test starts, we should have:

- [x] `cargo audit` clean
- [x] `pnpm audit` clean
- [x] `gitleaks` clean
- [x] All endpoints auth required
- [x] All modules triple-signed
- [x] All backups encrypted
- [x] Hash chain verifiable
- [x] Incident response plan
- [x] GDPR endpoints tested
- [x] OpenAPI spec current

(When all checked, the pen-test can start.)
```

## TESTS

```bash
cd /workspace
test -f docs/security/PEN-TEST-FINDINGS.md || { echo "FAIL"; exit 1; }
grep -q "Severity" docs/security/PEN-TEST-FINDINGS.md || { echo "FAIL"; exit 1; }
echo "OK"
```
