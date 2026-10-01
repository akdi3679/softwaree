# TASK ID: REPO-003.5
# TITLE: Commit workspace foundation
# STATUS: pending
# DEPENDENCIES: REPO-003.1, REPO-003.2, REPO-003.3, REPO-003.4
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the workspace configuration files as a single commit.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add package.json pnpm-workspace.yaml .npmrc tsconfig.base.json
git commit -m "chore: add pnpm workspace and base config (REPO-003)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit exists with the expected message
- [ ] The commit contains exactly 4 files: package.json, pnpm-workspace.yaml, .npmrc, tsconfig.base.json
- [ ] Working tree is clean

## TESTS

```bash
cd product

MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-003" || { echo "FAIL: msg $MSG"; exit 1; }

# Check the files in the commit
for f in package.json pnpm-workspace.yaml .npmrc tsconfig.base.json; do
  git show HEAD --name-only --pretty= | grep -q "^$f$" || { echo "FAIL: missing $f in commit"; exit 1; }
done

test -z "$(git status --porcelain)" || { echo "FAIL: dirty tree"; exit 1; }
echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0
