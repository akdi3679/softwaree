# TASK ID: CLOUD-023.2
# TITLE: Commit CSRF
# STATUS: pending
# DEPENDENCIES: CLOUD-023.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/middleware/csrf.ts
git commit -m "feat(cloud): add CSRF guard (CLOUD-023)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-023" || { echo "FAIL"; exit 1; }
echo "OK"
```
