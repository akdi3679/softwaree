# TASK ID: SECURITY-004.3
# TITLE: Commit security depth
# STATUS: pending
# DEPENDENCIES: SECURITY-004.2
# ALLOWED FILES: docs/.git/, product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add security
git commit -m "docs(security): add pen-test plan"

cd /workspace/product
git add apps/admin/src-tauri/src/sync/fuzz_frames.rs
git commit -m "test(security): add sync frame decoder fuzz target (SECURITY-004)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "pen-test" || { echo "FAIL"; exit 1; }
cd /workspace/product
git log -1 --pretty=%s | grep -q "SECURITY-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
