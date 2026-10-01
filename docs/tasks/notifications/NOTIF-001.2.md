# TASK ID: NOTIF-001.2
# TITLE: Commit notifications
# STATUS: pending
# DEPENDENCIES: NOTIF-001.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit notifications.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(notif): add in-app notification center (NOTIF-001)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "NOTIF-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
