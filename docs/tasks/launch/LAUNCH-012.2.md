# TASK ID: LAUNCH-012.2
# TITLE: Commit Spanish
# STATUS: pending
# DEPENDENCIES: LAUNCH-012.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src/i18n/es.json
git commit -m "feat(i18n): add Spanish translation (LAUNCH-012)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-012" || { echo "FAIL"; exit 1; }
echo "OK"
```
