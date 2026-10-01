# TASK ID: REPO-002.6
# TITLE: Create docs/ directory
# STATUS: pending
# DEPENDENCIES: REPO-001.6
# ALLOWED FILES: product/docs/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `docs/` directory.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p docs
```

## ACCEPTANCE CRITERIA
- [ ] `docs/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d docs || { echo "FAIL"; exit 1; }
test ! "$(ls -A docs)" || { echo "FAIL"; exit 1; }
echo "OK"
```
