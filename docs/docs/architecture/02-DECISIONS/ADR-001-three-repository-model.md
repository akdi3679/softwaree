# ADR-001: Three-Repository Model

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The platform ecosystem has three distinct concerns:
1. The customer-facing product (Admin + User apps, modules)
2. The private cloud platform (auth, projects, devices, modules registry, audit)
3. The internal infrastructure (CI/CD, secrets, monitoring)

We must decide whether to put all of this in one repository, two, or three.

## Decision

**Three separate repositories.** No shared code, no shared CI, no shared deployment.

```
product/            ← ships to customers
platform-cloud/     ← deployed by our team, internal
internal-infra/     ← deployed by our ops team, internal
```

Each repo has its own README, its own CI pipeline, its own access control list, its own versioning.

## Consequences

### Positive

- **Access control.** Future contractors and open-source contributors see only `product/`. The Cloud and infra repos are private to the team.
- **Blast radius.** A leaked Cloud secret (signing key, DB credential) requires compromise of the Cloud repo, not just a typo in a customer-facing file.
- **Deployment lifecycle separation.** Product ships to customers every 2 weeks. Cloud deploys on our schedule. Infra rarely changes. Each has its own CI.
- **Compliance.** SOC2 / HIPAA audit later: `platform-cloud/` is a self-contained audit surface.
- **Clear ownership.** Each repo has its own CODEOWNERS, its own reviewers, its own on-call rotation.

### Negative

- **Shared types friction.** When a Cloud API endpoint changes, both `platform-cloud/` and `product/` change. We solve this with the `product/packages/contracts` package, published as a versioned npm package, consumed by both sides.
- **Two CI pipelines instead of one.** Minor cost; the separation is worth it.
- **Harder to refactor across repos.** We accept this — cross-repo refactors should be rare and deliberate (an ADR).

### Neutral

- The three repos live in separate folders locally, not in a mega-monorepo. We do not use git submodules.

## Alternatives Considered

### One monorepo with three workspaces

**Pros:** easier cross-repo refactors, single CI.
**Cons:** one leaked secret exposes everything; one compromised CI runs everything; access control is harder to enforce; builds are slower.
**Rejected because:** the security and access-control benefits of physical separation outweigh the convenience of one repo.

### Two repos: product + cloud-infra

**Pros:** still simple, product is one repo.
**Cons:** `internal-infra` (Internal-infra (CI, secrets, monitoring) would live inside `platform-cloud`, mixing two concerns.
**Rejected because:** the infra layer has a fundamentally different change cadence and ownership model than the Cloud application.

### Product-as-plugin into Cloud

**Pros:** "everything ships together."
**Cons:** customers don't want our Cloud's source, our Cloud's secrets, or our CI configuration. Defeats the purpose of a private platform.
**Rejected because:** it confuses the boundary. The customer product is a customer product. The Cloud is our platform.

## Enforcement

- CODEOWNERS file in each repo restricts who can approve PRs to what.
- The `product/packages/contracts` package is the only allowed cross-repo import. It's published as a versioned npm package and consumed by all three.
- CI in each repo runs architecture tests that fail if unexpected cross-repo dependencies are detected.
