# TASK ID: BACKUP-001.4
# TITLE: Commit backup scheduler + restore + verify
# STATUS: pending
# DEPENDENCIES: BACKUP-001.3
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit backup suite.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(backup): add scheduler, restore command, verify tool (BACKUP-001)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "BACKUP-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
