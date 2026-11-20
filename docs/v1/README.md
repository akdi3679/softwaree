# Product v1 — Food Lab (Admin-only)

**Milestone name:** v1-foodlab

This is the first shippable milestone. It is a **strict subset** of the
final architecture in `docs/architecture/`. Same skeleton, fewer organs.

It ships **one module** (food-lab) on **Plan 1+ Solo Cloud** (ADR-021).
The architecture's v1 also includes medical-reception; that is added later
as a new signed bundle with its own table prefix, requiring no migration.

Read in order:
1. `00-OVERVIEW.md` — what v1 is, the **13 locks**, relation to the final
2. `01-FLOW.md` — the exact user flow
3. `02-DATA-MODEL.md` — **17 tables** (8 platform + 9 module)
4. `03-UPDATES.md` — how v1 changes safely
5. `04-PHASES.md` — the build order with definition-of-done
6. `05-ACCEPTANCE.md` — the **14 tests** that prove v1 is correct
7. `ADR-021-plan-tier.md` — the plan tier and price
8. `ADR-022-key-custody.md` — the key hierarchy and password boundary

## Counts

- 13 locks
- 17 tables — 8 platform + 9 module (`mod_food_lab_*`)
- 10 pages
- 8 phases (0–7)
- 14 acceptance tests

## Precedence

If code disagrees with these docs, **the docs win** until an ADR supersedes.
If these docs disagree with `docs/architecture/`, **the architecture wins**
until an ADR in this folder explicitly amends it (as ADR-021 and ADR-022 do).