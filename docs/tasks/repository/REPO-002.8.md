# TASK ID: REPO-002.8
# TITLE: Create scripts/ directory
# STATUS: pending
# DEPENDENCIES: REPO-001.6
# ALLOWED FILES: product/scripts/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `scripts/` directory for build/dev/ops scripts.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p scripts
```

## ACCEPTANCE CRITERIA
- [ ] `scripts/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d scripts || { echo "FAIL"; exit 1; }
test ! "$(ls -A scripts)" || { echo "FAIL"; exit 1; }
echo "OK"
```
