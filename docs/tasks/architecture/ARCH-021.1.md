# TASK ID: ARCH-021.1
# TITLE: Add architecture: final INDEX
# STATUS: pending
# DEPENDENCIES: ADMIN-062.2
# ALLOWED FILES: docs/INDEX.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Master index of all docs.

## REQUIRED IMPLEMENTATION

Create `docs/INDEX.md`:

```markdown
# Product Docs — Master Index

## Start here

- [Overview](./architecture/00-OVERVIEW.md) — what is this?
- [Principles](./architecture/01-PRINCIPLES.md) — the 12 non-negotiables
- [Cheat sheet](./architecture/PRINCIPLES-CHEATSHEET.md) — one-pager
- [FAQ](./FAQ.md) — top 10 customer questions
- [Roadmap](./architecture/ROADMAP.md) — what's coming

## Architecture

- [All ADRs](./architecture/02-DECISIONS/)
- [Stack](./architecture/03-STACK.md)
- [Data flow](./architecture/02-DECISIONS/DATA-FLOW.md)
- [Data model](./architecture/DATA-MODEL.md)
- [Topology](./architecture/TOPOLOGY.md)
- [Sync protocol](./architecture/SYNC-PROTOCOL.md)
- [our mesh setup](./architecture/TAILNET.md)
- [Threat model](./architecture/THREAT-MODEL.md)
- [Build vs buy](./architecture/02-DECISIONS/BUILD-VS-BUY.md)
- [Scaling path](./architecture/02-DECISIONS/SCALING-PATH.md)
- [Tauri patterns](./architecture/TAURI-PATTERNS.md)
- [Cold start](./architecture/STARTUP.md)
- [Cost](./architecture/COST.md)
- [Performance](./architecture/07-PERFORMANCE.md)
- [Testing](./architecture/TESTING.md)
- [Glossary](./architecture/GLOSSARY.md)
- [Services catalog](./architecture/SERVICES.md)
- [Customer explainer](./architecture/CUSTOMER-EXPLAINER.md)
- [API versioning](./architecture/API-VERSIONING.md)
- [Deprecation](./architecture/DEPRECATION.md)
- [Success metrics](./architecture/METRICS.md)
- [SLA / SLO](./architecture/SLA.md)
- [INDEX](./architecture/INDEX.md)

## Compliance

- [HIPAA](./compliance/HIPAA.md)
- [GDPR](./compliance/GDPR.md)
- [SOC2](./compliance/SOC2.md)
- [SOC2 matrix](./compliance/SOC2-MATRIX.md)
- [Vendors](./compliance/VENDORS.md)

## Runbooks

- [DR](./runbooks/DR.md)
- [Support](./runbooks/SUPPORT.md)
- [Signing](./release/SIGNING.md)
- [Rollback](./release/ROLLBACK.md)

## Migration

- [v1 → v2](./migration/V1-TO-V2.md)
- [v2 schema](./migration/V2-SCHEMA.md)

## Modules

- [Tutorial](./modules/TUTORIAL.md)
- [Cookbook](./modules/COOKBOOK.md)
- [Publisher](./marketplace/PUBLISHER.md)
- [Customer](./marketplace/CUSTOMER.md)

## Templates

- [Postmortem](./templates/POSTMORTEM.md)
```

## TESTS

```bash
cd /workspace
test -f docs/INDEX.md || { echo "FAIL"; exit 1; }
grep -q "Roadmap" docs/INDEX.md || { echo "FAIL"; exit 1; }
echo "OK"
```
