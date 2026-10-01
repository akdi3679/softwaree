# TASK ID: CONTRACT-012.2
# TITLE: Define DeviceState enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-012.1
# ALLOWED FILES: product/packages/contracts/src/domain/device-state.ts, product/packages/contracts/src/domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `DeviceState` — lifecycle states a device can be in.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/domain/device-state.ts`:

```typescript
import { z } from 'zod';

/**
 * Device lifecycle states.
 *
 *  PENDING → ACTIVE → (SUSPENDED | REVOKED | REPLACED)
 *
 * - PENDING: device registered, awaiting first auth challenge
 * - ACTIVE: device is currently authorized
 * - SUSPENDED: temporarily disabled (anomaly detected, support action)
 * - REVOKED: terminal, no recovery without re-registration
 * - REPLACED: replaced by a new device (old device's history preserved for audit)
 */
export const DeviceState = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
  REPLACED: 'replaced',
} as const;

export type DeviceState = (typeof DeviceState)[keyof typeof DeviceState];

export const DeviceStateSchema = z.nativeEnum(DeviceState);
```

Update `product/packages/contracts/src/domain/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] 5 states defined
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/domain/device-state.ts || { echo "FAIL"; exit 1; }
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/domain/device-state.ts)
test "$COUNT" -eq 5 || { echo "FAIL: $COUNT"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
