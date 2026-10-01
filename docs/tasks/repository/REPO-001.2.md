# TASK ID: REPO-001.2
# TITLE: Initialize git repository in product/
# STATUS: pending
# DEPENDENCIES: REPO-001.1
# ALLOWED FILES: product/.git/ (git internals)
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Initialize a fresh git repository inside `product/` with the default branch named `main`.

## REQUIRED IMPLEMENTATION

```bash
cd product
git init --initial-branch=main
```

## ACCEPTANCE CRITERIA
- [ ] `.git/` directory exists inside `product/`
- [ ] Default branch is named `main`
- [ ] Working tree is clean

## TESTS

```bash
cd product
test -d .git && \
  git symbolic-ref HEAD refs/heads/main && \
  git status --porcelain | wc -l | grep -q '^0$' && \
  echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## REFERENCE
- ADR-001-three-repository-model.md
