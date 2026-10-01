# TASK ID: USER-005.5
# TITLE: Commit user domain pages
# STATUS: pending
# DEPENDENCIES: USER-005.4
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit User domain pages.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(user): add domain pages, event log viewer, connection status, annotations (USER-005)"
git tag user-v0.2.0
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-005" || { echo "FAIL"; exit 1; }
git tag -l | grep -q "user-v0.2.0" || { echo "FAIL: no tag"; exit 1; }
echo "OK"
```
