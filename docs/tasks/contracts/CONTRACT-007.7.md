# TASK ID: CONTRACT-007.7
# TITLE: Commit command envelope
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.6
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit command envelope, types, and tests.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/commands
git commit -m "feat(contracts): add command envelope, CommandType enum, CommandPolicy, descriptor, result with tests (CONTRACT-007)"
```

## ACCEPTANCE CRITERIA
- [ ] One commit, message references CONTRACT-007

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-007" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "commands/envelope.ts" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "commands/commands.test.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
