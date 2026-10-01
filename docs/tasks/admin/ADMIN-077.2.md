# TASK ID: ADMIN-077.2
# TITLE: Commit docker
# STATUS: pending
# DEPENDENCIES: ADMIN-077.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add docker-compose.dev.yml
git commit -m "build(admin): add docker-compose dev (ADMIN-077)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-077" || { echo "FAIL"; exit 1; }
echo "OK"
```
