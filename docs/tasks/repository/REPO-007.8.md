# TASK ID: REPO-007.8
# TITLE: Commit contracts package skeleton
# STATUS: pending
# DEPENDENCIES: REPO-007.7
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the contracts package skeleton.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts pnpm-lock.yaml
git commit -m "feat(contracts): create package skeleton with submodule barrels (REPO-007)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit
- [ ] Commit message format matches
- [ ] `packages/contracts/package.json`, `tsconfig.json`, and all `src/**/*.ts` files are in the commit
- [ ] `node_modules/` is NOT in the commit

## TESTS

```bash
cd product

MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-007" || { echo "FAIL"; exit 1; }

# Spot-check key files
for f in "packages/contracts/package.json" "packages/contracts/tsconfig.json" "packages/contracts/src/index.ts" "packages/contracts/src/identity/index.ts"; do
  git show HEAD --name-only --pretty= | grep -q "^$f$" || { echo "FAIL: $f not in commit"; exit 1; }
done

# No node_modules
git show HEAD --name-only --pretty= | grep -q "^node_modules/" && { echo "FAIL: node_modules in commit"; exit 1; }

echo "OK"
```
