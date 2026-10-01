# TASK ID: ADMIN-089.2
# TITLE: Commit lints
# STATUS: pending
# DEPENDENCIES: ADMIN-089.1
# ALLOWED FILES: .git/, product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
git add .clippy.toml
git commit -m "build: strict clippy (ADMIN-089)"

cd /workspace/product
git add apps/admin/src-tauri/Cargo.toml
git commit -m "build(admin): add strict lints (ADMIN-089)"
```

## TESTS

```bash
cd /workspace
git log -1 --pretty=%s | grep -q "ADMIN-089" || { echo "FAIL"; exit 1; }
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-089" || { echo "FAIL"; exit 1; }
echo "OK"
```
