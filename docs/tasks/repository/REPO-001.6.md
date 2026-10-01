# TASK ID: REPO-001.6
# TITLE: Create initial commit in product repo
# STATUS: pending
# DEPENDENCIES: REPO-001.3, REPO-001.4, REPO-001.5
# ALLOWED FILES: product/.git/ (git internals only)
# FORBIDDEN FILES: any new file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the first commit on `main` containing `.gitignore` and `README.md`.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add .gitignore README.md
git commit -m "chore: initial commit (REPO-001.6)

- Add .gitignore with Node, Rust, Tauri, IDE, OS exclusions
- Add README.md with repository structure and getting-started guide"
```

## ACCEPTANCE CRITERIA
- [ ] Exactly one commit exists on `main`
- [ ] Commit message starts with `chore: initial commit`
- [ ] Commit contains exactly 2 files: `.gitignore` and `README.md`
- [ ] Working tree is clean after commit

## TESTS

```bash
cd product

# One commit
COUNT=$(git rev-list --count HEAD)
test "$COUNT" = "1" || { echo "FAIL: $COUNT commits"; exit 1; }

# Commit message format
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "^chore: initial commit" || { echo "FAIL: msg $MSG"; exit 1; }

# Exactly 2 files in the commit
FILES=$(git show --name-only --pretty= HEAD | grep -v "^$" | wc -l)
test "$FILES" = "2" || { echo "FAIL: $FILES files"; exit 1; }

# Working tree clean
test -z "$(git status --porcelain)" || { echo "FAIL: dirty"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## REFERENCE
- ADR-001-three-repository-model.md
