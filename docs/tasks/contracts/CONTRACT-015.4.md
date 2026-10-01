# TASK ID: CONTRACT-015.4
# TITLE: Commit plan domain
# STATUS: pending
# DEPENDENCIES: CONTRACT-015.3
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit plan domain.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/plan-domain
git commit -m "feat(contracts): add plan domain (Plan, Subscription, built-in plans) (CONTRACT-015)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-015" || { echo "FAIL"; exit 1; }
echo "OK"
```
