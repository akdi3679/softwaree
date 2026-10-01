# TASK ID: WAREHOUSE-001.1
# TITLE: Add data warehouse ETL (anonymized events to ClickHouse)
# STATUS: pending
# DEPENDENCIES: MIGRATION-001.2
# ALLOWED FILES: platform-cloud/src/warehouse/etl.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Daily ETL: anonymized events from Cloud Postgres → ClickHouse for analytics.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
"dependencies": {
  "@clickhouse/client": "^1.7.0"
}
```

Create `platform-cloud/src/warehouse/etl.ts`:

```typescript
import { createClient } from '@clickhouse/client';
import { db } from '../db';
import { auditEntries } from '../db/schema';
import { gte, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASS ?? '',
});

const ANON_SALT = process.env.ANON_SALT ?? 'change-me-in-prod';

function anonymizeActor(actor: string | null): string {
  if (!actor) return 'null';
  return createHash('sha256').update(actor + ANON_SALT).digest('hex').slice(0, 16);
}

/// ETL: yesterday's events from Postgres to ClickHouse.
export async function runEtl(): Promise<{ rows: number; duration_ms: number }> {
  const start = Date.now();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const rows = await db.select().from(auditEntries).where(gte(auditEntries.occurredAt, yesterday));
  if (rows.length === 0) return { rows: 0, duration_ms: Date.now() - start };

  // Anonymize + insert
  const values = rows.map((r) => [
    anonymizeActor(r.accountId),
    anonymizeActor(r.deviceId),
    r.action,
    r.result,
    r.occurredAt,
  ]);

  await clickhouse.insert({
    table: 'audit_events',
    values,
    format: 'Values',
    columns: ['account_id_anon', 'device_id_anon', 'action', 'result', 'occurred_at'],
  });

  return { rows: rows.length, duration_ms: Date.now() - start };
}

/// Cron entry point.
export function schedule() {
  setInterval(async () => {
    try {
      const result = await runEtl();
      console.log('etl complete', result);
    } catch (e) {
      console.error('etl failed', e);
    }
  }, 24 * 3600 * 1000);
}
```

## TESTS

```bash
cd platform-cloud
test -f src/warehouse/etl.ts || { echo "FAIL"; exit 1; }
grep -q "anonymize" src/warehouse/etl.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
