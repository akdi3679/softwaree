# TASK ID: RELEASE-001.1
# TITLE: Add Changesets setup for product repo
# STATUS: pending
# DEPENDENCIES: DR-001.4
# ALLOWED FILES: product/.changeset/config.json, product/.changeset/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Set up Changesets for the product repo. Each PR includes a changeset; releases are gated by it.

## REQUIRED IMPLEMENTATION

Create `product/.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.5/schema.json",
  "changelog": ["@changesets/cli", "version", "--message", "chore(release): version packages"],
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["modules/*", "internal-infra"]
}
```

Create `product/.changeset/README.md`:

```markdown
# Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage releases.

## Adding a changeset

When your PR changes behavior, add a changeset:

```bash
pnpm changeset
```

This prompts for:
- Which packages changed (admin, user, contracts, module-sdk)
- Semver bump: major / minor / patch
- A short summary of the change

A new file is created in `.changeset/` — commit it with your PR.

## Releasing

When a PR is merged that contains `.changeset/*.md` files, the CI bot:
1. Opens a "Version Packages" PR
2. That PR bumps versions and updates CHANGELOG.md
3. When that PR is merged, packages are published

## What does NOT need a changeset

- Internal refactors (no behavior change)
- Test additions
- Docs only
```

Create an initial changeset:

`product/.changeset/initial-release.md`:

```markdown
---
"@product/admin": 0.1.0
"@product/user": 0.1.0
"@product/contracts": 0.1.0
"@product/module-sdk": 0.1.0
---

Initial release of the product platform.
```

## TESTS

```bash
cd product
test -f .changeset/config.json || { echo "FAIL"; exit 1; }
test -f .changeset/README.md || { echo "FAIL"; exit 1; }
test -f .changeset/initial-release.md || { echo "FAIL: no initial changeset"; exit 1; }
echo "OK"
```
