# TASK ID: REPO-002.3
# TITLE: Create apps/user/ directory
# STATUS: pending
# DEPENDENCIES: REPO-002.1
# ALLOWED FILES: product/apps/user/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `apps/user/` directory for the User Tauri app.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p apps/user
```

## ACCEPTANCE CRITERIA
- [ ] `apps/user/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d apps/user || { echo "FAIL"; exit 1; }
test ! "$(ls -A apps/user)" || { echo "FAIL"; exit 1; }
echo "OK"
```
