# TASK ID: CLOUD-003.1
# TITLE: Create drizzle config
# STATUS: pending
# DEPENDENCIES: CLOUD-002.8
# ALLOWED FILES: platform-cloud/apps/api/drizzle.config.ts, platform-cloud/apps/api/.env.example
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Configure Drizzle Kit for migrations.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://cloud:cloud@localhost:5432/cloud',
  },
  verbose: true,
  strict: true,
});
```

Create `platform-cloud/apps/api/.env.example`:

```bash
# Database
DATABASE_URL=postgres://cloud:cloud@localhost:5432/cloud

# API
PORT=8080
LOG_LEVEL=info
NODE_ENV=development

# MinIO (encrypted backups)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio-secret
MINIO_BUCKET=cloud-backups
MINIO_USE_SSL=false

# Signing keys (in production, loaded from HSM)
CLOUD_ROOT_SIGNING_KEY_PATH=./keys/cloud-root.pem
CLOUD_ROOT_PUBLIC_KEY_PATH=./keys/cloud-root.pub

# Our WireGuard mesh
TAILSCALE_API_KEY=
HEADSCALE_URL=http://localhost:8080
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/drizzle.config.ts || { echo "FAIL"; exit 1; }
test -f apps/api/.env.example || { echo "FAIL: no env example"; exit 1; }
grep -q "DATABASE_URL" apps/api/drizzle.config.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
