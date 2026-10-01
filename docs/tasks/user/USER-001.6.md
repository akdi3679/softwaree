# TASK ID: USER-001.6
# TITLE: Commit User app scaffold
# STATUS: pending
# DEPENDENCIES: USER-001.5
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the User scaffold.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/user
git commit -m "feat(user): init User Tauri app with Tauri 2, Rust crate, device identity, projection DB (USER-001)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "USER-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
