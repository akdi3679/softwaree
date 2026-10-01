# TASK ID: LOAD-005.2
# TITLE: Commit backlog
# STATUS: pending
# DEPENDENCIES: LOAD-005.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user/src-tauri/tests
git commit -m "test(load): add 1M backlog replay (LOAD-005)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LOAD-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
