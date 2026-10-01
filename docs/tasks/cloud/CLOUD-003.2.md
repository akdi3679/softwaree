# TASK ID: CLOUD-003.2
# TITLE: Create DB connection module
# STATUS: pending
# DEPENDENCIES: CLOUD-003.1
# ALLOWED FILES: platform-cloud/apps/api/src/db/client.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the Drizzle database client (postgres-js).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Pool sized for the expected load. Tune for your deployment.
const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false, // pgbouncer compat
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
```

## TESTS

```bash
cd platform-cloud
mkdir -p apps/api/src/db/schema
test -f apps/api/src/db/client.ts || { echo "FAIL"; exit 1; }
grep -q "drizzle" apps/api/src/db/client.ts || { echo "FAIL"; exit 1; }
grep -q "postgres" apps/api/src/db/client.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
