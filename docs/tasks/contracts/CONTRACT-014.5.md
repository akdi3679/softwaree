# TASK ID: CONTRACT-014.5
# TITLE: Commit project domain
# STATUS: pending
# DEPENDENCIES: CONTRACT-014.4
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit project domain entities.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/project-domain
git commit -m "feat(contracts): add project domain (Project, Membership, Role, Permission) (CONTRACT-014)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-014" || { echo "FAIL"; exit 1; }
echo "OK"
```
