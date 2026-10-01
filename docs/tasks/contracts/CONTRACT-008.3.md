# TASK ID: CONTRACT-008.3
# TITLE: Add query contract tests
# STATUS: pending
# DEPENDENCIES: CONTRACT-008.2
# ALLOWED FILES: product/packages/contracts/src/queries/queries.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add tests that lock the query envelope.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/queries/queries.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { QueryEnvelopeSchema } from './index';

describe('QueryEnvelopeSchema', () => {
  it('rejects empty object', () => {
    const r = QueryEnvelopeSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('does not require idempotency key', () => {
    const r = QueryEnvelopeSchema.safeParse({
      queryId: '00000000-0000-0000-0000-000000000001',
      queryType: 'patient.list',
      projectId: 'proj_01hxy4z8k2j9n3pqrstvw',
      actorId: 'usr_01hxy4z8k2j9n3pqrstvw',
      deviceId: 'dev_01hxy4z8k2j9n3pqrstvw',
      sessionId: 'sess_01hxy4z8k2j9n3pqrstvw',
      createdAt: new Date().toISOString(),
      payload: {},
    });
    expect(r.success).toBe(true);
  });
});
```

## ACCEPTANCE CRITERIA
- [ ] Tests pass

## TESTS

```bash
cd product
test -f packages/contracts/src/queries/queries.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts test > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
