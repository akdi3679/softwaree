# TASK ID: CHAOS-003.3
# TITLE: Commit chaos depth
# STATUS: pending
# DEPENDENCIES: CHAOS-003.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/tests
git commit -m "test(chaos): add disk-full + no-tailscale tests (CHAOS-003)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CHAOS-003" || { echo "FAIL"; exit 1; }
echo "OK"
```
