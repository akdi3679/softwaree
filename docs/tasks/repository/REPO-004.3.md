# TASK ID: REPO-004.3
# TITLE: Commit Biome configuration
# STATUS: pending
# DEPENDENCIES: REPO-004.2
# ALLOWED FILES: product/.gitignore, product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Commit the Biome setup. Update .gitignore to exclude generated files from Biome's perspective. Commit the new files.

## REQUIRED IMPLEMENTATION

```bash
cd product

# Update .gitignore to ignore pnpm-lock.yaml? NO — commit it.
# But we should ignore biome's cache if it creates one.
# Biome doesn't create a cache file in v1.x — skip.

git add biome.json
git add pnpm-lock.yaml
git commit -m "chore: add Biome config and lockfile (REPO-004)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit exists with the expected message
- [ ] `biome.json` and `pnpm-lock.yaml` are in the commit
- [ ] `node_modules/` is NOT in the commit (still gitignored)
- [ ] Working tree is clean (only generated lockfile and biome.json should be new)

## TESTS

```bash
cd product

MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-004" || { echo "FAIL: msg $MSG"; exit 1; }

git show HEAD --name-only --pretty= | grep -q "^biome.json$" || { echo "FAIL: biome.json not in commit"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "^pnpm-lock.yaml$" || { echo "FAIL: pnpm-lock.yaml not in commit"; exit 1; }

# node_modules must NOT be in commit
git show HEAD --name-only --pretty= | grep -q "^node_modules/" && { echo "FAIL: node_modules in commit"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0
