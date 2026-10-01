# TASK ID: CONTRACT-008.2
# TITLE: Define QueryDescriptor
# STATUS: pending
# DEPENDENCIES: CONTRACT-008.1
# ALLOWED FILES: product/packages/contracts/src/queries/descriptor.ts, product/packages/contracts/src/queries/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `QueryDescriptor<TPayload, TResult>` — the metadata for a specific query type.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/queries/descriptor.ts`:

```typescript
import type { z } from 'zod';

/**
 * Metadata for a specific query type. Modules and core register queries
 * by providing a descriptor.
 *
 * Queries are read-only. They do not produce events.
 */
export interface QueryDescriptor<TPayload, TResult> {
  readonly queryType: string;
  readonly version: number;
  readonly payloadSchema: z.ZodType<TPayload>;
  readonly resultSchema: z.ZodType<TResult>;
  readonly requiredPermission: string;
  readonly description: string;
  readonly cacheable: boolean;
  readonly cacheTtlSeconds?: number;
}
```

Update `product/packages/contracts/src/queries/index.ts`:

```typescript
export type { QueryEnvelope } from './envelope';
export { QueryEnvelopeSchema } from './envelope';
export type { QueryDescriptor } from './descriptor';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Has cacheable flag and cacheTtlSeconds

## TESTS

```bash
cd product
test -f packages/contracts/src/queries/descriptor.ts || { echo "FAIL"; exit 1; }
grep -q "QueryDescriptor" packages/contracts/src/queries/descriptor.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
