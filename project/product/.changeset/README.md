# Changesets

We use Changesets to manage releases.

## Adding a changeset

When a PR changes behavior, add a changeset:

    pnpm changeset

Prompts for which packages changed, semver bump, and a summary.
A new file appears in .changeset/ - commit it with your PR.

## Releasing

On merge with .changeset/*.md files, CI opens a "Version Packages" PR.
Merging that PR bumps versions and publishes.

## No changeset needed for

- Internal refactors (no behavior change)
- Test additions
- Docs only
