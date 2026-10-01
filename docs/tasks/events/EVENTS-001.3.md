# TASK ID: EVENTS-001.3
# TITLE: Commit event registry + versioning
# STATUS: pending
# DEPENDENCIES: EVENTS-001.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit event contracts.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add packages/contracts/src/events
git commit -m "feat(events): add schema versioning + central event registry (EVENTS-001)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "EVENTS-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
