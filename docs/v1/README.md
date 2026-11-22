
README.md
# Product v1 — Food Lab (Admin-only)

**Milestone name:** v1-foodlab

This is the first shippable milestone. It is a **strict subset** of the
final architecture in `docs/architecture/`. Same skeleton, fewer organs.

It ships **one module** (food-lab) on **Plan 1+ Solo Cloud** (big-doc
ADR-021). The architecture's v1 also includes medical-reception; that is
added later as a new signed bundle with its own table prefix, requiring
no migration.

Read in order:
1. `00-OVERVIEW.md` — what v1 is, the **14 locks**, relation to the final
2. `01-FLOW.md` — the exact user flow
3. `02-DATA-MODEL.md` — **19 tables** (10 platform + 9 module)
4. `03-UPDATES.md` — how v1 changes safely
5. `04-PHASES.md` — the build order with definition-of-done
6. `05-ACCEPTANCE.md` — the tests that prove v1 is correct
7. `KEY-SCOPE.md` — which keys are active in v1 vs deferred
8. `DEVIATIONS.md` — documented, bounded deviations from the big doc

References into the big doc (authoritative):
- `docs/architecture/02-DECISIONS/ADR-021-plan-tiers.md` — plan tiers incl. Plan 1+
- `docs/architecture/02-DECISIONS/ADR-022-key-custody-and-recovery.md` — key hierarchy
- `docs/architecture/01-PRINCIPLES.md` — the 14 non-negotiable rules

## Counts

- 14 locks
- 19 tables — 10 platform + 9 module (`mod_food_lab_*`)
- 10 pages
- 9 phases (0–7, with 6a/6b)
- 28 acceptance tests

## Precedence

If code disagrees with these docs, **the docs win** until an ADR supersedes.
If these docs disagree with `docs/architecture/`, **the architecture wins**.
The former `v1/ADR-021` and `v1/ADR-022` have been merged into the big-doc
ADRs of the same numbers; `KEY-SCOPE.md` records which keys are active in v1,
and `DEVIATIONS.md` explicitly lists what is deferred in this milestone.
