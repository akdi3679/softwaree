# TASK ID: CLOUD-024.2
# TITLE: Commit error
# STATUS: pending
# DEPENDENCIES: CLOUD-024.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/middleware/error_handler.ts
git commit -m "feat(cloud): add structured error handler (CLOUD-024)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-024" || { echo "FAIL"; exit 1; }
echo "OK"
```
