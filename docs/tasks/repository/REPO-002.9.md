# TASK ID: REPO-002.9
# TITLE: Commit directory structure
# STATUS: pending
# DEPENDENCIES: REPO-002.1, REPO-002.2, REPO-002.3, REPO-002.4, REPO-002.5, REPO-002.6, REPO-002.7, REPO-002.8
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the empty directory structure as a single commit.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps packages modules docs .github scripts
git commit -m "chore: create empty directory structure (REPO-002)"
```

Note: git does not track empty directories. This commit will only register the directories if a `.gitkeep` placeholder is added. Use this approach instead:

```bash
cd product
# Add .gitkeep to each so the directories are tracked
for dir in apps/admin apps/user packages modules docs .github scripts; do
  : > "$dir/.gitkeep"
done
git add .
git commit -m "chore: create directory structure with .gitkeep placeholders (REPO-002)"
```

Future tasks that populate these directories will remove the .gitkeep files as needed.

## ACCEPTANCE CRITERIA
- [ ] All 8 directories exist and are tracked by git
- [ ] Each contains a `.gitkeep` file
- [ ] One new commit exists with the expected message

## TESTS

```bash
cd product

for dir in apps/admin apps/user packages modules docs .github scripts; do
  test -f "$dir/.gitkeep" || { echo "FAIL: missing $dir/.gitkeep"; exit 1; }
  git ls-files --error-unmatch "$dir/.gitkeep" > /dev/null || { echo "FAIL: not tracked $dir/.gitkeep"; exit 1; }
done

MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "REPO-002" || { echo "FAIL: msg $MSG"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0
