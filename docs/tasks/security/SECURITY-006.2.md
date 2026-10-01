# TASK ID: SECURITY-006.2
# TITLE: Commit brute force
# STATUS: pending
# DEPENDENCIES: SECURITY-006.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/auth
git commit -m "feat(security): add brute force protection (SECURITY-006)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "SECURITY-006" || { echo "FAIL"; exit 1; }
echo "OK"
```
