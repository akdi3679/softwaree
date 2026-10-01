# TASK ID: SECURITY-001.6
# TITLE: Commit security hardening
# STATUS: pending
# DEPENDENCIES: SECURITY-001.5
# ALLOWED FILES: product/.git/, platform-cloud/.git/, /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit security hardening.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(security): tighten CSP and asset scope for Admin Tauri (SECURITY-001)"

cd /workspace/platform-cloud
git add src/middleware src/log
git commit -m "feat(security): add rate limit, security headers, secrets redaction (SECURITY-001)"

cd /workspace
git add docs/security
git commit -m "docs: add threat model (SECURITY-001)" || echo "docs not in any repo, manual copy"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "SECURITY-001" || { echo "FAIL"; exit 1; }
cd /workspace/product
git log -1 --pretty=%s | grep -q "SECURITY-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
