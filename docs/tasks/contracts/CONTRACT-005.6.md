# TASK ID: CONTRACT-005.6
# TITLE: Define NetworkError
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.5
# ALLOWED FILES: product/packages/contracts/src/errors/network.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `NetworkError — for transport-level failures (TCP, WebSocket, our mesh)).

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/network.ts`:

```typescript
import { z } from 'zod';
import { ErrorContractSchema } from './contract';

/**
 * Network error: transport-level failure.
 *
 * Most common: connection dropped, timeout, DNS failure, our mesh
 * not reachable. Always category: TRANSIENT or UNAVAILABLE. Retryable.
 *
 * `code` values:
 *   NET_CONNECTION_REFUSED
 *   NET_TIMEOUT
 *   NET_DNS_FAILURE
 *   NET_TAILSCALE_DOWN
 *   NET_LAN_UNREACHABLE
 *   NET_PROTOCOL_ERROR
 */
export const NetworkErrorSchema = ErrorContractSchema.extend({
  category: z.union([z.literal('transient'), z.literal('unavailable')]),
  code: z.string().regex(/^NET_/, 'must start with NET_'),
  details: z
    .object({
      endpoint: z.string().optional(),
      retryAfterMs: z.number().int().optional(),
      attempt: z.number().int().optional(),
    })
    .optional(),
});

export type NetworkError = z.infer<typeof NetworkErrorSchema>;
```

Update `product/packages/contracts/src/errors/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] category is `transient` or `unavailable`
- [ ] `code` starts with `NET_`
- [ ] Optional retry hint

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/network.ts || { echo "FAIL"; exit 1; }
grep -q "NET_" packages/contracts/src/errors/network.ts || { echo "FAIL: no prefix"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
