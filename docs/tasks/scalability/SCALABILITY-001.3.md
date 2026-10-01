# TASK ID: SCALABILITY-001.3
# TITLE: Commit scaling infra
# STATUS: pending
# DEPENDENCIES: SCALABILITY-001.2
# ALLOWED FILES: product/.git/, platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit scaling infra.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/scaling package.json
git commit -m "feat(scaling): add health/ready endpoints, cluster heartbeat, project routing (SCALABILITY-001)"

cd /workspace
git add docs/architecture/02-DECISIONS/SCALING-PATH.md
git commit -m "docs(scaling): add scaling path ADR" || echo "docs separate"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "SCALABILITY-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
