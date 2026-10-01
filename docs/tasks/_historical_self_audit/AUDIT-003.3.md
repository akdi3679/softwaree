# TASK ID: AUDIT-003.3
# TITLE: Commit audit depth
# STATUS: pending
# DEPENDENCIES: AUDIT-003.2
# ALLOWED FILES: product/.git/, platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/src/audit
git commit -m "feat(audit): add tamper detection (AUDIT-003)"

cd /workspace/platform-cloud
git add audit
git commit -m "feat(audit): add tampering alert webhook (AUDIT-003)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "AUDIT-003" || { echo "FAIL"; exit 1; }
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "AUDIT-003" || { echo "FAIL"; exit 1; }
echo "OK"
```
