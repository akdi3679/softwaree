# TASK ID: REPO-002.5
# TITLE: Create modules/ directory
# STATUS: pending
# DEPENDENCIES: REPO-001.6
# ALLOWED FILES: product/modules/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `modules/` directory for business modules.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p modules
```

## ACCEPTANCE CRITERIA
- [ ] `modules/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d modules || { echo "FAIL"; exit 1; }
test ! "$(ls -A modules)" || { echo "FAIL"; exit 1; }
echo "OK"
```
