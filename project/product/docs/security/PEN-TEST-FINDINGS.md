# Pen-test Findings

## Active findings

| ID | Severity | Title | Status | Owner | Due |
|---|---|---|---|---|---|
| (none yet) | | | | | |

## Severity definitions

- Critical: Active exploit; data at risk. Fix within 24h.
- High: Exploitable with conditions. Fix within 7 days.
- Medium: Vulnerability requiring significant effort. Fix within 30 days.
- Low: Hardening opportunity. Fix within 90 days.
- Info: Note for awareness. No fix required.

## Status values

- Open
- In progress
- Fixed (awaiting re-test)
- Verified (pen-tester confirmed)
- Will not fix (reason documented)
- Duplicate

## SLA

| Severity | Time to fix | Re-test |
|---|---|---|
| Critical | 24h | 7 days |
| High | 7 days | 30 days |
| Medium | 30 days | 60 days |
| Low | 90 days | 90 days |

## Pre-test checklist

- [ ] cargo audit clean
- [ ] pnpm audit clean
- [ ] gitleaks clean
- [ ] All endpoints auth-required
- [ ] All modules triple-signed
- [ ] All backups encrypted
- [ ] Hash chain verifiable
- [ ] Incident response plan exists
- [ ] GDPR endpoints tested
- [ ] OpenAPI spec current

## Vendor log

| Date | Vendor | Scope | Report |
|---|---|---|---|
| (TBD) | Trail of Bits (proposed) | Full platform | (link) |