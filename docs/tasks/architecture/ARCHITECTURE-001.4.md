# TASK ID: ARCHITECTURE-001.4
# TITLE: Commit architecture docs
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-001.3
# ALLOWED FILES: /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit architecture docs.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
git add docs/architecture
git commit -m "docs(arch): add data flow, build-vs-buy, deployment documents (ARCHITECTURE-001)" || echo "docs/ in product repo, manual copy"
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/DATA-FLOW.md || { echo "FAIL: no data flow"; exit 1; }
test -f docs/architecture/02-DECISIONS/BUILD-VS-BUY.md || { echo "FAIL: no build vs buy"; exit 1; }
test -f docs/architecture/04-DEPLOYMENT.md || { echo "FAIL: no deployment"; exit 1; }
echo "OK"
```
