# TASK ID: REPO-005.3
# TITLE: Commit vitest config
# STATUS: pending
# DEPENDENCIES: REPO-005.2
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the Vitest configuration.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add vitest.config.ts
git commit -m "chore: add Vitest config (REPO-005)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit
- [ ] vitest.config.ts is in the commit
- [ ] Working tree clean

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-005" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "^vitest.config.ts$" || { echo "FAIL"; exit 1; }
test -z "$(git status --porcelain)" || { echo "FAIL: dirty"; exit 1; }
echo "OK"
```
