# TASK ID: CLOUD-001.2
# TITLE: Create platform-cloud README, .gitignore, LICENSE
# STATUS: pending
# DEPENDENCIES: CLOUD-001.1
# ALLOWED FILES: platform-cloud/README.md, platform-cloud/.gitignore, platform-cloud/LICENSE
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the platform-cloud README, .gitignore, and LICENSE.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/.gitignore` with this content:

```gitignore
node_modules/
.pnpm-store/
dist/
build/
*.tsbuildinfo
.env
.env.local
!.env.example
*.log
coverage/

# Secrets — NEVER commit
keys/
*.pem
*.key
*.p12

# Drizzle generated files
drizzle/migrations/

# Docker
docker-compose.override.yml
```

Create `platform-cloud/README.md`:

```markdown
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
```

## License

Proprietary. All rights reserved.
```

Create `platform-cloud/LICENSE` (placeholder):

```
Proprietary License

All rights reserved. Unauthorized copying, modification, distribution,
or use of this software is strictly prohibited.
```

## ACCEPTANCE CRITERIA
- [ ] All 3 files exist
- [ ] .gitignore has expected entries

## TESTS

```bash
cd platform-cloud
test -f README.md || { echo "FAIL"; exit 1; }
test -f .gitignore || { echo "FAIL"; exit 1; }
test -f LICENSE || { echo "FAIL"; exit 1; }
grep -q "node_modules" .gitignore || { echo "FAIL"; exit 1; }
grep -q "keys/" .gitignore || { echo "FAIL"; exit 1; }
echo "OK"
```
