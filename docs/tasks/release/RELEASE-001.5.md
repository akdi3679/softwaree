# TASK ID: RELEASE-001.5
# TITLE: Commit release pipeline
# STATUS: pending
# DEPENDENCIES: RELEASE-001.4
# ALLOWED FILES: product/.git/, /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit release pipeline + docs.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add .changeset .github/workflows/release.yml
git commit -m "feat(release): add Changesets + release workflow (RELEASE-001)"

cd /workspace
git add docs/release 2>/dev/null && git commit -m "docs: signing + rollback procedures" || echo "docs/ separate repo"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "RELEASE-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
