# TASK ID: USER-004.7
# TITLE: Commit User extras (heartbeat, auto-reconnect, gap, tests)
# STATUS: pending
# DEPENDENCIES: USER-004.6
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit remaining User features.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/user
git commit -m "feat(user): add heartbeat, auto-reconnect, mDNS, gap detection, snapshot applier, tests (USER-004)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "USER-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
