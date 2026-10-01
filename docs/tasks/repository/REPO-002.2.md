# TASK ID: REPO-002.2
# TITLE: Create apps/admin/ directory
# STATUS: pending
# DEPENDENCIES: REPO-002.1
# ALLOWED FILES: product/apps/admin/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `apps/admin/` directory for the Admin Tauri app.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p apps/admin
```

## ACCEPTANCE CRITERIA
- [ ] `apps/admin/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d apps/admin || { echo "FAIL"; exit 1; }
test ! "$(ls -A apps/admin)" || { echo "FAIL"; exit 1; }
echo "OK"
```
