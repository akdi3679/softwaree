# Contributing

Thank you for contributing to the Product platform! This repository is
private, and contributions are limited to the core team and approved
collaborators.

## Development Setup

1. Install Node.js (version specified in `.nvmrc`).
2. Install pnpm (version specified in `packageManager`).
3. Run `pnpm install --frozen-lockfile`.
4. Run `pnpm run lint` to check code style.
5. Run `pnpm run typecheck` to verify types.
6. Run `pnpm test` to execute tests.

## Branching Model

- `main` is the integration branch.
- Create feature branches from `main` with descriptive names (e.g.,
  `feat/contracts-identity-types`).
- Submit pull requests for review.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
specification.

Examples:
- `feat(admin): add patient list page`
- `fix(user): correct sync cursor on reconnect`
- `chore: update dependencies`

## Code Style

- TypeScript: enforced by Biome.
- Rust: enforced by `cargo fmt` and `cargo clippy`.

## Testing

- Write unit tests for new functionality.
- Ensure all existing tests pass before submitting a PR.

## Review Process

- At least one core team member must approve.
- All CI checks must pass.
- Architecture changes must be accompanied by an ADR.
