# TASK ID: PERFORMANCE-002.2
# TITLE: Commit perf depth
# STATUS: pending
# DEPENDENCIES: PERFORMANCE-002.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit perf depth.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/src/startup.rs
git commit -m "feat(perf): add startup time measurement (PERFORMANCE-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "PERFORMANCE-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
