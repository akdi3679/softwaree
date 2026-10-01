# TASK ID: MODULE-004.4
# TITLE: Commit modules depth
# STATUS: pending
# DEPENDENCIES: MODULE-004.3
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit modules.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules
git commit -m "feat(modules): full retail-pos, gym, school implementations (MODULE-004)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MODULE-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
