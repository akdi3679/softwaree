# TASK ID: ADMIN-002.8
# TITLE: Commit Tauri config
# STATUS: pending
# DEPENDENCIES: ADMIN-002.7
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit Tauri config + frontend deps.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/admin
git commit -m "feat(admin): add tauri.conf.json, icons, Vite config, Tailwind, TanStack Router/Query (ADMIN-002)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "ADMIN-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
