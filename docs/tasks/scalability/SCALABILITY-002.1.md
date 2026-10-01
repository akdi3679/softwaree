# TASK ID: SCALABILITY-002.1
# TITLE: Add Postgres read replica configuration
# STATUS: pending
# DEPENDENCIES: SECURITY-003.3
# ALLOWED FILES: platform-cloud/src/db/replica.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
At Stage 1+, route SELECTs to a read replica.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/db/replica.ts`:

```typescript
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const PRIMARY_URL = process.env.DATABASE_URL ?? '';
const REPLICA_URL = process.env.DATABASE_REPLICA_URL ?? '';

const primaryPool = new Pool({ connectionString: PRIMARY_URL, max: 20 });
export const db: NodePgDatabase<typeof schema> = drizzle(primaryPool, { schema });

let replicaPool: Pool | null = null;
let replicaDb: NodePgDatabase<typeof schema> | null = null;

if (REPLICA_URL) {
  replicaPool = new Pool({ connectionString: REPLICA_URL, max: 50 });
  replicaDb = drizzle(replicaPool, { schema });
}

/// Get the read connection. Uses replica if available, primary otherwise.
export function readDb(): NodePgDatabase<typeof schema> {
  return replicaDb ?? db;
}

/// Writes always go to primary. Helper for clarity.
export function writeDb(): NodePgDatabase<typeof schema> {
  return db;
}
```

## TESTS

```bash
cd platform-cloud
test -f src/db/replica.ts || { echo "FAIL"; exit 1; }
grep -q "readDb" src/db/replica.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
