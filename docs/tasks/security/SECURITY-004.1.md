# TASK ID: SECURITY-004.1
# TITLE: Add pen-test plan document
# STATUS: pending
# DEPENDENCIES: BACKUP-005.3
# ALLOWED FILES: docs/security/PEN-TEST-PLAN.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Annual pen-test scope and approach.

## REQUIRED IMPLEMENTATION

Create `docs/security/PEN-TEST-PLAN.md`:

```markdown
# Penetration Test Plan

## Scope

- **Cloud** (`platform-cloud`): public web app + API
- **Admin** (`product/apps/admin`): Tauri desktop app + WebSocket sync
- **User** (`product/apps/user`): Tauri desktop app + WebSocket sync
- **Internal-infra**: our mesh, Infisical, Woodpecker

Out of scope: customer data (none on Cloud anyway), third-party services
(Stripe, Resend — they pen-test themselves).

## Methodology

OWASP WSTG (Web Security Testing Guide) + OWASP MASVS for mobile.

## Tests

### T1 — Authentication

- [ ] Brute-force login → should rate-limit at 5/min
- [ ] Weak password allowed? → no (zxcvbn score >= 3)
- [ ] Forgot password flow → email link + 15 min expiry
- [ ] TOTP bypass attempt → no
- [ ] Device revocation without consent? → must require AuthN + AuthZ

### T2 — Authorization

- [ ] User can read another project's data? → no
- [ ] Revoked device can still sync? → no
- [ ] Non-admin can install modules? → no
- [ ] Wrong project's Admin device can write? → no (sig fails)

### T3 — Input validation

- [ ] SQL injection in email field? → no (parameterized)
- [ ] XSS in patient name (rendered on User app)? → no (React escapes)
- [ ] Path traversal in attachment filename? → no (sanitize)
- [ ] Oversized payload (1 GB)? → rejected at 10 MB limit
- [ ] CBOR / JSON fuzzing → no crashes (cargo-fuzz + fast-check)

### T4 — Sync protocol

- [ ] Replay old event → rejected (sequence check)
- [ ] Forge event with admin's device sig? → only if attacker has device key
- [ ] Snapshot older than current → rejected (monotonic)
- [ ] WebSocket message size > 1 MB → closed
- [ ] WebSocket with stale token → closed

### T5 — Module sandbox

- [ ] Module escapes Wasmtime? → no (capability-based)
- [ ] Module reads other module's data? → no (per-module host state)
- [ ] Module spawns subprocess? → no (no wasi_process in our import)
- [ ] Module writes to disk outside mount? → no (only /work, /tmp mounts)

### T6 — Cloud

- [ ] SSRF on backup download URL? → no (MinIO signed URLs only)
- [ ] DDoS (100K RPS)? → fail open with rate limit + CDN (Stage 2+)
- [ ] Stripe webhook forgery? → signature verification
- [ ] Email enumeration on signup? → no (always returns "check your email")
- [ ] Audit log deletion? → no (immutable)
- [ ] Audit log tampering? → no (hash chain)

### T7 — Cryptography

- [ ] Ed25519 key leaked? → device must be revoked
- [ ] AES-GCM nonce reuse? → no (random 96-bit per encryption)
- [ ] Argon2 downgraded? → no (only id variant)
- [ ] TLS version < 1.3? → rejected

### T8 — Operational

- [ ] Gitleaks on all branches? → yes (CI blocks)
- [ ] Cargo audit at release? → yes
- [ ] pnpm audit at release? → yes
- [ ] SBOM generated? → yes (cargo-cyclonedx)
- [ ] Container scan? → trivy in CI

## Reporting

Pen-test report format:
1. Executive summary
2. Findings (CVSS 4.0)
3. Reproduction steps
4. Remediation
5. Re-test results

## Vendors (recommended)

- Trail of Bits
- Cure53
- NCC Group
- Bishop Fox
- Insomni'hack (for training)

## Frequency

Once per year (mandatory). After any major incident or major architecture
change. Cost: $30K-50K per round.

## Re-test

Any Critical or High finding must be re-tested within 30 days.
```

## TESTS

```bash
cd /workspace
test -f docs/security/PEN-TEST-PLAN.md || { echo "FAIL"; exit 1; }
grep -q "OWASP" docs/security/PEN-TEST-PLAN.md || { echo "FAIL"; exit 1; }
echo "OK"
```
