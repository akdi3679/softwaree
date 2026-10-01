# TASK ID: CLOUD-020.2
# TITLE: Commit IP rate
# STATUS: pending
# DEPENDENCIES: CLOUD-020.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/middleware/ip_rate.ts
git commit -m "feat(cloud): add IP rate limit (CLOUD-020)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-020" || { echo "FAIL"; exit 1; }
echo "OK"
```
