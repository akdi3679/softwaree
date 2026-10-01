# TASK ID: CLOUD-015.2
# TITLE: Commit recovery
# STATUS: pending
# DEPENDENCIES: CLOUD-015.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/auth/recovery.ts
git commit -m "feat(auth): add account recovery flow (CLOUD-015)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-015" || { echo "FAIL"; exit 1; }
echo "OK"
```
