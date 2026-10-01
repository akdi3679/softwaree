# TASK ID: PERFORMANCE-001.4
# TITLE: Commit performance budgets and benchmarks
# STATUS: pending
# DEPENDENCIES: PERFORMANCE-001.3
# ALLOWED FILES: product/.git/, platform-cloud/.git/, /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit perf budgets + benchmarks.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/benches apps/admin/src-tauri/Cargo.toml
git commit -m "feat(perf): add SQLite benchmarks (PERFORMANCE-001)"

cd /workspace/platform-cloud
git add benches package.json
git commit -m "feat(perf): add API benchmarks (PERFORMANCE-001)"

cd /workspace
git add docs/performance
git commit -m "docs(perf): add performance budgets" || echo "docs in product repo"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "PERFORMANCE-001" || { echo "FAIL"; exit 1; }
cd /workspace/product
git log -1 --pretty=%s | grep -q "PERFORMANCE-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
