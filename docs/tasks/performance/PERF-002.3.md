# TASK ID: PERF-002.3
# TITLE: Commit perf depth
# STATUS: pending
# DEPENDENCIES: PERF-002.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps
git commit -m "perf: add SQLite tuning + projection batch insert (PERF-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "PERF-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
