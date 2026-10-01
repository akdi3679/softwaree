# TASK ID: REPO-001.4
# TITLE: Create product/README.md
# STATUS: pending
# DEPENDENCIES: REPO-001.2
# ALLOWED FILES: product/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 10 minutes

## OBJECTIVE
Create the root README for the `product` repository. It should describe what the product is, who owns it, and where to find the architecture docs.

## REQUIRED IMPLEMENTATION

Create the file `product/README.md` with EXACTLY this content:

```markdown
# Product — Admin and User Desktop Applications

The customer-facing desktop platform. Ships to customers as two Tauri apps:
- **Admin** — the project authority (one per project), holds the source of truth
- **User** — a projection client, holds only authorized data

The Cloud platform that this product talks to lives in a separate private repository
(`platform-cloud/`) maintained by our team. See `docs/architecture/00-OVERVIEW.md`
in this repo for the full ecosystem picture.

## Repository structure

```
apps/
  admin/          — Tauri + React admin app
  user/           — Tauri + React user app
packages/
  contracts/      — shared TypeScript types and Zod schemas
  cloud-client/   — TypeScript client for the Cloud API
modules/
  medical/        — first business module (doctor reception)
  food-lab/       — second business module (food analysis lab)
docs/
  architecture/   — architecture documents and ADRs
tasks/            — executable micro-tasks (REPO-*, CONTRACT-*, etc.)
```

## Status

Pre-launch. Architecture is locked. Implementation in progress.

## Where to start

1. Read `docs/architecture/00-OVERVIEW.md`
2. Read `docs/architecture/01-PRINCIPLES.md`
3. Read all ADRs in `docs/architecture/02-DECISIONS/`
4. Read `docs/architecture/03-STACK.md`
5. Pick a task from `tasks/README.md` and execute it

## License

Proprietary. All rights reserved.
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/README.md`
- [ ] File content matches exactly
- [ ] All referenced paths in the README are correct (no broken links)
- [ ] File size is approximately 1000-1500 bytes

## TESTS

```bash
cd product

test -f README.md || { echo "FAIL"; exit 1; }

SIZE=$(wc -c < README.md)
test "$SIZE" -ge 800 && test "$SIZE" -le 2000 || { echo "FAIL size $SIZE"; exit 1; }

# Required sections present
grep -q "^# Product" README.md || { echo "FAIL: missing title"; exit 1; }
grep -q "## Repository structure" README.md || { echo "FAIL: missing structure"; exit 1; }
grep -q "## Where to start" README.md || { echo "FAIL: missing start section"; exit 1; }
grep -q "apps/" README.md || { echo "FAIL: missing apps"; exit 1; }
grep -q "packages/" README.md || { echo "FAIL: missing packages"; exit 1; }
grep -q "modules/" README.md || { echo "FAIL: missing modules"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## REFERENCE
- ADR-001-three-repository-model.md
- docs/architecture/00-OVERVIEW.md
