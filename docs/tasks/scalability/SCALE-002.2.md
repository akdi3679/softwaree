# TASK ID: SCALE-002.2
# TITLE: Commit routing
# STATUS: pending
# DEPENDENCIES: SCALE-002.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/routing
git commit -m "feat(cloud): add project routing (SCALE-002)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "SCALE-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
