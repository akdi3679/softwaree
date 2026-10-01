# TASK ID: SEARCH-001.3
# TITLE: Commit search
# STATUS: pending
# DEPENDENCIES: SEARCH-001.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit search.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(search): add FTS5 full-text search on User (SEARCH-001)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SEARCH-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
