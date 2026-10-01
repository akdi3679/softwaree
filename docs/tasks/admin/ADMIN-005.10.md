# TASK ID: ADMIN-005.10
# TITLE: Commit core domain + command engine
# STATUS: pending
# DEPENDENCIES: ADMIN-005.9
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the core domain, audit, event store, outbox, command engine, first command.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/admin
git commit -m "feat(admin): add core domain (User, Role, Audit), event store, outbox dispatcher, command engine, invite_user command (ADMIN-005)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "ADMIN-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
