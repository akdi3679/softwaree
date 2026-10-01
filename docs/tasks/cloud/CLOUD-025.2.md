# TASK ID: CLOUD-025.2
# TITLE: Commit CORS
# STATUS: pending
# DEPENDENCIES: CLOUD-025.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/middleware/cors.ts
git commit -m "feat(cloud): add CORS allow-list (CLOUD-025)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-025" || { echo "FAIL"; exit 1; }
echo "OK"
```
