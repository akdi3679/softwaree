# TASK ID: CLOUD-003.3
# TITLE: Create DB migration script
# STATUS: pending
# DEPENDENCIES: CLOUD-003.2
# ALLOWED FILES: platform-cloud/apps/api/src/db/migrate.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the migration runner script.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/migrate.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  console.log('[migrate] running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('[migrate] done');
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/migrate.ts || { echo "FAIL"; exit 1; }
grep -q "migrate" apps/api/src/db/migrate.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
