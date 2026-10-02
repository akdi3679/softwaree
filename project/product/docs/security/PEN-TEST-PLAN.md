# Penetration Test Plan

## Scope

- Cloud (platform-cloud): public web app + API
- Admin (product/apps/admin): Tauri desktop + WebSocket sync
- User (product/apps/user): Tauri desktop + WebSocket sync
- Internal-infra: our mesh, Infisical, Woodpecker

## Methodology

OWASP WSTG (Web Security Testing Guide) + OWASP MASVS for mobile.

## Test areas

T1 Authentication, T2 Authorization, T3 Input validation, T4 Sync protocol,
T5 Module sandbox, T6 Cloud, T7 Cryptography, T8 Operational.

Each area has a checklist covering known attack patterns from OWASP Top 10.

## Reporting

Executive summary, findings with CVSS 4.0, reproduction steps, remediation,
re-test results.

## Vendors (recommended)

Trail of Bits, Cure53, NCC Group, Bishop Fox.

## Frequency

Yearly, plus after any major incident or major architecture change.
Cost estimate: 30K-50K USD per round.

## Re-test

Any Critical or High finding must be re-tested within 30 days.
