# TASK ID: USER-002.5
# TITLE: Commit User backend
# STATUS: pending
# DEPENDENCIES: USER-002.4
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit User sync + commands.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/user
git commit -m "feat(user): add sync client (our mesh+WS), event applier, mesh reader, commands (USER-002)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "USER-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
