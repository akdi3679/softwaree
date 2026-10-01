# TASK ID: MODULE-001.5
# TITLE: Commit module SDK + Cloud signer
# STATUS: pending
# DEPENDENCIES: MODULE-001.4
# ALLOWED FILES: product/.git/, platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit module SDK + Cloud signer.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/module-sdk packages/contracts/src/module
git commit -m "feat(modules): add Rust SDK, WIT, and TS manifest schema (MODULE-001)"

cd ../platform-cloud
git add src/modules
git commit -m "feat(modules): add Cloud signing service + module routes (MODULE-001)"
```

## TESTS

```bash
cd /workspace/product && git log -1 --pretty=%s | grep -q "MODULE-001" || { echo "FAIL"; exit 1; }
cd /workspace/platform-cloud && git log -1 --pretty=%s | grep -q "MODULE-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
