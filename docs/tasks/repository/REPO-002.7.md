# TASK ID: REPO-002.7
# TITLE: Create .github/ directory
# STATUS: pending
# DEPENDENCIES: REPO-001.6
# ALLOWED FILES: product/.github/ (directory only)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty `.github/` directory for GitHub-specific files (workflows, templates, CODEOWNERS).

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p .github
```

## ACCEPTANCE CRITERIA
- [ ] `.github/` exists
- [ ] Directory is empty

## TESTS

```bash
cd product
test -d .github || { echo "FAIL"; exit 1; }
test ! "$(ls -A .github)" || { echo "FAIL"; exit 1; }
echo "OK"
```
