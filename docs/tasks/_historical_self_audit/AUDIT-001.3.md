# TASK ID: AUDIT-001.3
# TITLE: Commit audit chain
# STATUS: pending
# DEPENDENCIES: AUDIT-001.2
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit Cloud audit chain.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/audit db/migrations/0002_audit.sql
git commit -m "feat(audit): add tamper-evident audit chain + verify endpoint (AUDIT-001)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "AUDIT-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
