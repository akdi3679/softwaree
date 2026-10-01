# TASK ID: USER-010.3
# TITLE: [NEEDS REGENERATION]
# STATUS: blocked
# DEPENDENCIES: (see sibling files in user/)
# ALLOWED FILES: (TBD on regeneration)
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: TBD

> **This task file failed to extract from the source archive (0 bytes).**
> **It needs to be regenerated before it can be implemented.**

## What this file SHOULD contain

This task is part of the `user` task tree. Its sibling files (e.g., `USER-001.1.md`) are present and can be used to infer the expected content and dependencies.

### Reference format (from a sibling file):

```markdown
# TASK ID: USER-001.1
# TITLE: Init User Tauri app
# STATUS: pending
# DEPENDENCIES: ADMIN-011.5
# ALLOWED FILES: product/apps/user/package.json, product/apps/user/tsconfig.json, product/apps/user/vite.config.ts, product/apps/user/index.html
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
```

## How to regenerate

1. Read the task ID (`USER-010.3`) and the surrounding files in the same category.
2. Check `/workspace/docs/architecture/00-OVERVIEW.md` and the related ADRs.
3. Look at the sibling task files in the same directory for the format and granularity.
4. Use the standard format:
   - TASK ID, TITLE, STATUS, DEPENDENCIES
   - ALLOWED FILES / FORBIDDEN FILES
   - OBJECTIVE (1-2 sentences)
   - REQUIRED IMPLEMENTATION (exact code)
   - TESTS (exact bash)
   - EXPECTED OUTPUT
5. Write the regenerated file in place of this placeholder.

## Goal alignment context

All tasks must align with the user's goal. See the architecture docs for the full picture:
- 3 repos (product, platform-cloud, internal-infra)
- 4 systems (Cloud, Admin, User, Internal-Infra)
- Authority model: Cloud → Admin → User
- One Admin per project, no co-admins
- 4 plans: Local / Starter / Team / Enterprise
- 2 modules: medical-reception, food-lab
- Our own mesh, no third-party VPN
- Discovery service in Cloud (we know IPs, never data)
- Two-channel Cloud: public + private
- Forever soft-delete (corbeille) with per-plan quota
- Live-heart updates (Cloud can push SQL/data updates)
- Admin offline = no writes
- RBAC (roles for many users with same auth)
- Empty-account signup → admin assignment
- Admin-chosen backup time, Plan 4 manual with limits

## Reference

- `/workspace/tasks/INDEX.md` — master index
- `/workspace/tasks/README.md` — task tree overview
- `/workspace/docs/architecture/00-OVERVIEW.md` — architecture overview
- `/workspace/docs/architecture/01-PRINCIPLES.md` — 13 non-negotiable rules
