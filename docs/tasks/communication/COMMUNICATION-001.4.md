# TASK ID: COMMUNICATION-001.4
# TITLE: Commit network architecture
# STATUS: pending
# DEPENDENCIES: COMMUNICATION-001.3
# ALLOWED FILES: product/.git/, /workspace/docs/, /workspace/internal-infra/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit network architecture.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/src/comm
git commit -m "feat(comm): add mDNS service registration for Admin (COMMUNICATION-001)"

cd /workspace
git add docs/architecture/TAILNET.md
git commit -m "docs(network): add our mesh two-network architecture" || echo "docs separate"

cd /workspace/internal-infra
git add headscale
git commit -m "feat(headscale): add ACL config and tests" || echo "internal-infra repo separate"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "COMMUNICATION-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
