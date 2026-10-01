# TASK ID: AUDIT-002.2
# TITLE: Commit audit export
# STATUS: pending
# DEPENDENCIES: AUDIT-002.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit audit export.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/src/audit
git commit -m "feat(audit): add CSV + JSON export with signature (AUDIT-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "AUDIT-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
