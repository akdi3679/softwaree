# TASK ID: AUDIT-031.1
# TITLE: Self-audit fix #27: ADR-020 discovery service (we know IPs, never data)
# STATUS: pending
# DEPENDENCIES: AUDIT-030.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-020-discovery-service.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document the refined architecture: we run a discovery service that
knows IPs but never sees data.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The user clarified the flow: we (platform owner) DO know real IPs
of devices. This is the trade-off. The discovery service helps
cross-network setup while keeping data direct.

## See ADR-020 for full content
The content is in `docs/architecture/02-DECISIONS/ADR-020-discovery-service.md`.

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-020-discovery-service.md || { echo "FAIL"; exit 1; }
grep -q "Discovery" docs/architecture/02-DECISIONS/ADR-020-discovery-service.md || { echo "FAIL"; exit 1; }
echo "OK"
```
