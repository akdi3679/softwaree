# TASK ID: SECURITY-005.2
# TITLE: Commit rotation
# STATUS: pending
# DEPENDENCIES: SECURITY-005.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(security): add device key rotation (SECURITY-005)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SECURITY-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
