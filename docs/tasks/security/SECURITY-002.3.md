# TASK ID: SECURITY-002.3
# TITLE: Add SECURITY.md with vulnerability reporting
# STATUS: pending
# DEPENDENCIES: SECURITY-002.2
# ALLOWED FILES: /workspace/SECURITY.md, product/SECURITY.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document how to report security vulnerabilities.

## REQUIRED IMPLEMENTATION

Create `product/SECURITY.md`:

```markdown
# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x (current dev) | ✅ |
| < 0.1 | ❌ |

## Reporting a vulnerability

**Please do not open a public issue.**

Email: `security@product.local`
PGP key: https://product.local/.well-known/pgp-key.asc (fingerprint: `AAAA BBBB CCCC DDDD EEEE  FFFF 0000 1111 2222 3333`)

We will:
1. Acknowledge within 24 hours
2. Triage within 72 hours
3. Provide a fix timeline within 7 days
4. Coordinate disclosure with you

We follow responsible disclosure:
- We aim to fix critical issues within 30 days
- We aim to fix high issues within 90 days
- We aim to fix medium issues within 180 days
- Low issues are bundled into regular releases

We will credit you in the security advisory (unless you prefer to remain anonymous).

## Scope

In scope:
- Admin / User Tauri apps
- Cloud Hono API
- Module runtime
- Backup encryption
- Sync protocol
- our mesh ACLs

Out of scope:
- The Cloud's underlying infrastructure (Hetzner, Postgres, MinIO) — report to those vendors
- Third-party modules from the marketplace — report to the module's publisher

## Bug bounty

We do not currently run a paid bug bounty program. We credit researchers in our security advisories.

## Security advisories

Past advisories: https://github.com/product/platform/security/advisories

Subscribe to releases for notifications: https://github.com/product/platform/releases
```

## TESTS

```bash
cd product
test -f SECURITY.md || { echo "FAIL"; exit 1; }
grep -q "Reporting a vulnerability" SECURITY.md || { echo "FAIL"; exit 1; }
echo "OK"
```
