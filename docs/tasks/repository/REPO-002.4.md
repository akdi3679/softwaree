# TASK ID: REPO-002.4
# TITLE: Create packages/ directory
# STATUS: pending
# DEPENDENCIES: REPO-001.6
# ALLOWED FILES: product/packages/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `packages/` directory.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p packages
```

## ACCEPTANCE CRITERIA
- [ ] `packages/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d packages || { echo "FAIL"; exit 1; }
test ! "$(ls -A packages)" || { echo "FAIL"; exit 1; }
echo "OK"
```
