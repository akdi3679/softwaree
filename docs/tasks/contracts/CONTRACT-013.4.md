# TASK ID: CONTRACT-013.4
# TITLE: Commit identity domain
# STATUS: pending
# DEPENDENCIES: CONTRACT-013.3
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit identity domain entities.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/identity-domain
git commit -m "feat(contracts): add identity domain (Account, Device, Invitation) (CONTRACT-013)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-013" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "identity-domain/account.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
