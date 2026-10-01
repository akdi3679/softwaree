# TASK ID: ADMIN-088.2
# TITLE: Commit rebrand
# STATUS: pending
# DEPENDENCIES: ADMIN-088.1
# ALLOWED FILES: product/.git/, tools/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "build(admin): add rebrand placeholders (ADMIN-088)"

cd /workspace/tools
git add rebrand.sh
git commit -m "feat(tools): add rebrand script (ADMIN-088)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-088" || { echo "FAIL"; exit 1; }
cd /workspace/tools
git log -1 --pretty=%s | grep -q "ADMIN-088" || { echo "FAIL"; exit 1; }
echo "OK"
```
