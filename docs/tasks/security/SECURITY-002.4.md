# TASK ID: SECURITY-002.4
# TITLE: Commit security CI
# STATUS: pending
# DEPENDENCIES: SECURITY-002.3
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit security CI + SECURITY.md.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add .github/workflows/secret-scan.yml .github/workflows/audit.yml .gitleaks.toml SECURITY.md
git commit -m "feat(security): add Gitleaks + cargo audit + pnpm audit + SECURITY.md (SECURITY-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SECURITY-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
