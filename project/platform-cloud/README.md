# Platform Cloud

The private cloud control plane for the product platform. Handles auth,
device registry, project registry, module signing, and encrypted backup
storage. Never holds business data.

This repository is private. The product (Admin and User apps) talks to it
through the versioned API contract published as the `@product/contracts`
TypeScript package in the `product/` repository.

## Architecture

See `/workspace/docs/architecture/00-OVERVIEW.md` for the full ecosystem
picture and `docs/architecture/02-DECISIONS/` for ADRs.

## Stack

- Node.js 22 LTS
- TypeScript 5.6+
- Hono 4 (web framework)
- Drizzle ORM + PostgreSQL 16
- MinIO (object storage)
- our discovery service (in our Cloud)

## Development

```bash
# Install
pnpm install

# Run locally
docker compose up -d
pnpm db:migrate
pnpm dev

# Test
pnpm test

# Build
pnpm build
