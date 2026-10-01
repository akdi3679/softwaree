# TASK ID: CONTRACT-003.3
# TITLE: Define SchemaVersion type
# STATUS: pending
# DEPENDENCIES: CONTRACT-003.2
# ALLOWED FILES: product/packages/contracts/src/version/schema-version.ts, product/packages/contracts/src/version/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SchemaVersion` — the database schema version, used for migrations.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/version/schema-version.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * Database schema version.
 *
 * Each database file (Cloud Postgres, Admin SQLite, User SQLite) has a
 * schema version. Migrations are forward-only, named, and tracked.
 *
 * Format: major.minor (e.g., 4.2). Major bumps may be breaking; minor
 * bumps are always backwards-compatible.
 */
export type SchemaVersion = Branded<'SchemaVersion', string>;

export const SchemaVersionSchema = z
  .string()
  .regex(/^\d+\.\d+$/, 'SchemaVersion must be in format "major.minor"')
  .brand<'SchemaVersion'>();
```

Update `product/packages/contracts/src/version/index.ts`:

```typescript
/**
 * Version and sequence types.
 */

export type { ProjectSequence } from './project-sequence';
export { ProjectSequenceSchema } from './project-sequence';
export type { AggregateVersion } from './aggregate-version';
export { AggregateVersionSchema } from './aggregate-version';
export type { SchemaVersion } from './schema-version';
export { SchemaVersionSchema } from './schema-version';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Format is `major.minor` (e.g., "1.0", "2.13")
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/version/schema-version.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'SchemaVersion', string>" packages/contracts/src/version/schema-version.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
