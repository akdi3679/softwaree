# TASK ID: MODULE-005.2
# TITLE: Commit module invoice
# STATUS: pending
# DEPENDENCIES: MODULE-005.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/invoice
git commit -m "feat(modules): add invoice PDF module (MODULE-005)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MODULE-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
