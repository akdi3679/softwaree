# TASK ID: ARCH-012.1
# TITLE: Add architecture: index of all docs
# STATUS: pending
# DEPENDENCIES: ARCH-011.2
# ALLOWED FILES: docs/architecture/INDEX.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Master index of all architecture docs.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/INDEX.md`:

```markdown
# Architecture Docs Index

## Core
- [00-OVERVIEW](./00-OVERVIEW.md) — What is this?
- [01-PRINCIPLES](./01-PRINCIPLES.md) — The 12 non-negotiable principles
- [02-DECISIONS](./02-DECISIONS/) — ADRs (architecture decision records)
- [03-STACK](./03-STACK.md) — Tech choices and why
- [04-DEPLOYMENT](./04-DEPLOYMENT.md) — How we deploy
- [05-FEATURES](./05-FEATURES.md) — What the system does
- [06-MIGRATIONS](./06-MIGRATIONS.md) — Database migration discipline
- [07-PERFORMANCE](./07-PERFORMANCE.md) — Perf budgets and measurements

## Patterns
- [DATA-FLOW](./02-DECISIONS/DATA-FLOW.md) — How data moves
- [TAURI-PATTERNS](./TAURI-PATTERNS.md) — Tauri 2 patterns we use
- [DATA-MODEL](./DATA-MODEL.md) — Tables and relationships
- [TOPOLOGY](./TOPOLOGY.md) — Deployment diagrams
- [TESTING](./TESTING.md) — Test pyramid and rules
- [STARTUP](./STARTUP.md) — Cold start optimization
- [COST](./COST.md) — Cost breakdown by stage

## Compliance
- [GLOSSARY](./GLOSSARY.md) — All terms defined
- [SERVICES](./SERVICES.md) — 3rd-party services catalog
- [CUSTOMER-EXPLAINER](./CUSTOMER-EXPLAINER.md) — Plain English version

## Modules
- [TUTORIAL](../modules/TUTORIAL.md) — How to build a module
- [COOKBOOK](../modules/COOKBOOK.md) — Common patterns
- [PUBLISHER](../marketplace/PUBLISHER.md) — How to publish
- [CUSTOMER](../marketplace/CUSTOMER.md) — How to install

## Compliance
- [HIPAA](../compliance/HIPAA.md)
- [GDPR](../compliance/GDPR.md)
- [SOC2](../compliance/SOC2.md)
- [VENDORS](../compliance/VENDORS.md)

## Runbooks
- [DR](../runbooks/DR.md) — Disaster recovery
- [SUPPORT](../runbooks/SUPPORT.md) — Customer support
- [SIGNING](../release/SIGNING.md) — Module signing
- [ROLLBACK](../release/ROLLBACK.md) — Release rollback

## Threat model
- [THREAT-MODEL](./THREAT-MODEL.md) — T1-T8 threats

## Other
- [BUILD-VS-BUY](./02-DECISIONS/BUILD-VS-BUY.md) — Every technology choice with alternatives
- [SCALING-PATH](./02-DECISIONS/SCALING-PATH.md) — How we scale 1 → 1M
- [SYNC-PROTOCOL](./SYNC-PROTOCOL.md) — Sync protocol v1 spec
- [TAILNET](./TAILNET.md) — our mesh setup

## Migration
- [V1-TO-V2](../migration/V1-TO-V2.md)
- [V2-SCHEMA](../migration/V2-SCHEMA.md)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/INDEX.md || { echo "FAIL"; exit 1; }
grep -q "00-OVERVIEW" docs/architecture/INDEX.md || { echo "FAIL"; exit 1; }
echo "OK"
```
