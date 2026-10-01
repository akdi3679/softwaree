# TASK ID: CONTRACT-009.3
# TITLE: Define EventDescriptor
# STATUS: pending
# DEPENDENCIES: CONTRACT-009.2
# ALLOWED FILES: product/packages/contracts/src/events/descriptor.ts, product/packages/contracts/src/events/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `EventDescriptor<TPayload>` — the metadata for a specific event type. Modules and core register events via this.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/events/descriptor.ts`:

```typescript
import type { z } from 'zod';

/**
 * Metadata for a specific event type. Modules and core register events
 * by providing a descriptor.
 */
export interface EventDescriptor<TPayload> {
  readonly eventType: string;
  readonly version: number;
  readonly payloadSchema: z.ZodType<TPayload>;
  readonly aggregateType: string;
  readonly description: string;
  /**
   * If true, this event triggers a User projection update.
   * If false, the event is internal (audit-only, no projection effect).
   */
  readonly affectsUserProjection: boolean;
}
```

Update `product/packages/contracts/src/events/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Has `affectsUserProjection` flag
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/events/descriptor.ts || { echo "FAIL"; exit 1; }
grep -q "EventDescriptor" packages/contracts/src/events/descriptor.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
