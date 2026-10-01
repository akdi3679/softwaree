# TASK ID: REPO-006.3
# TITLE: Create first changeset entry
# STATUS: pending
# DEPENDENCIES: REPO-006.2
# ALLOWED FILES: product/.changeset/init.md (new file)
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Create the first Changeset entry documenting the initial workspace setup.

## REQUIRED IMPLEMENTATION

Create the file `product/.changeset/init.md` with EXACTLY this content:

```markdown
---
"@product/contracts": patch
"@product/cloud-client": patch
---

Initial workspace setup. No public API yet — these packages exist as placeholders
for the contracts and cloud-client code that will be added in the next phase
(see `tasks/contracts/`).
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/.changeset/init.md`
- [ ] Frontmatter is valid YAML between `---` markers
- [ ] Lists both packages as `patch`
- [ ] Has a non-empty body

## TESTS

```bash
cd product

test -f .changeset/init.md || { echo "FAIL"; exit 1; }

# Frontmatter present
head -1 .changeset/init.md | grep -q "^---$" || { echo "FAIL: no frontmatter"; exit 1; }

# Both packages listed
grep -q '"@product/contracts": patch' .changeset/init.md || { echo "FAIL: contracts missing"; exit 1; }
grep -q '"@product/cloud-client": patch' .changeset/init.md || { echo "FAIL: cloud-client missing"; exit 1; }

# Body not empty
LINES=$(wc -l < .changeset/init.md)
test "$LINES" -gt 5 || { echo "FAIL: body too short"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0
