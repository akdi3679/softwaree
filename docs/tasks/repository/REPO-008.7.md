# TASK ID: REPO-008.7
# TITLE: Commit cloud-client package
# STATUS: pending
# DEPENDENCIES: REPO-008.6
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the cloud-client package skeleton.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/cloud-client pnpm-lock.yaml
git commit -m "feat(cloud-client): create package skeleton with submodule stubs (REPO-008)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit
- [ ] All cloud-client files present in commit

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-008" || { echo "FAIL"; exit 1; }
for f in "packages/cloud-client/package.json" "packages/cloud-client/tsconfig.json" "packages/cloud-client/src/index.ts" "packages/cloud-client/src/auth.ts"; do
  git show HEAD --name-only --pretty= | grep -q "^$f$" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
