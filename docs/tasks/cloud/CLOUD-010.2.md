# TASK ID: CLOUD-010.2
# TITLE: Commit cloud rate limit
# STATUS: pending
# DEPENDENCIES: CLOUD-010.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/middleware
git commit -m "feat(cloud): add rate limit middleware (CLOUD-010)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-010" || { echo "FAIL"; exit 1; }
echo "OK"
```
