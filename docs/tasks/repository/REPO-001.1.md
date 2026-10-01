# TASK ID: REPO-001.1
# TITLE: Create product repository root directory
# STATUS: pending
# DEPENDENCIES: none
# ALLOWED FILES: product/ (directory only, no files)
# FORBIDDEN FILES: any file inside product/
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the root directory for the `product` repository.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product
cd product
pwd
```

The working directory should now be `product/`. The output of `pwd` should end with `/product`.

## ACCEPTANCE CRITERIA
- [ ] `product/` directory exists at the workspace root
- [ ] Directory is empty (no files)
- [ ] Directory is writable

## TESTS

```bash
test -d product && test ! "$(ls -A product)" && echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## REFERENCE
- ADR-001-three-repository-model.md
