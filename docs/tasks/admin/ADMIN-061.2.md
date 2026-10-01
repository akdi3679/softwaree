# TASK ID: ADMIN-061.2
# TITLE: Commit README
# STATUS: pending
# DEPENDENCIES: ADMIN-061.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add README.md
git commit -m "docs: add product README (ADMIN-061)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-061" || { echo "FAIL"; exit 1; }
echo "OK"
```
