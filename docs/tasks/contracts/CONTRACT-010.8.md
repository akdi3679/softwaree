# TASK ID: CONTRACT-010.8
# TITLE: Commit sync contracts
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.7
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit sync contracts.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/sync
git commit -m "feat(contracts): add sync types (position, request, response, snapshot, conflict, ack, hello) (CONTRACT-010)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-010" || { echo "FAIL"; exit 1; }
for f in position.ts request.ts response.ts snapshot.ts conflict.ts ack.ts hello.ts index.ts; do
  git show HEAD --name-only --pretty= | grep -q "sync/$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
