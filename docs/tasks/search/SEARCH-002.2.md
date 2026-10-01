# TASK ID: SEARCH-002.2
# TITLE: Commit user search
# STATUS: pending
# DEPENDENCIES: SEARCH-002.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(user): add global search results (SEARCH-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SEARCH-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
