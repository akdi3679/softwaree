# TASK ID: MODULE-003.3
# TITLE: Commit module depth
# STATUS: pending
# DEPENDENCIES: MODULE-003.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit module depth.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/sdk-tests packages/module-sdk
git commit -m "feat(modules): add fuzz tests + capability validator (MODULE-003)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MODULE-003" || { echo "FAIL"; exit 1; }
echo "OK"
```
