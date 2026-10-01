# TASK ID: MODULE-007.2
# TITLE: Commit auto-billing
# STATUS: pending
# DEPENDENCIES: MODULE-007.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/auto-billing
git commit -m "feat(modules): add auto-billing module (MODULE-007)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MODULE-007" || { echo "FAIL"; exit 1; }
echo "OK"
```
