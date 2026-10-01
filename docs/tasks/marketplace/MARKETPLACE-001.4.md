# TASK ID: MARKETPLACE-001.4
# TITLE: Commit marketplace
# STATUS: pending
# DEPENDENCIES: MARKETPLACE-001.3
# ALLOWED FILES: platform-cloud/.git/, /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit marketplace.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/marketplace
git commit -m "feat(marketplace): add publisher, review, public routes (MARKETPLACE-001)"

cd /workspace
git add docs/marketplace
git commit -m "docs(marketplace): add publisher + customer guides" || echo "docs separate"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "MARKETPLACE-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
