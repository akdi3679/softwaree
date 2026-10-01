# TASK ID: CONTRACT-013.2
# TITLE: Define Device entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-013.1
# ALLOWED FILES: product/packages/contracts/src/identity-domain/device.ts, product/packages/contracts/src/identity-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Device` entity — Cloud's record of a registered device.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity-domain/device.ts`:

```typescript
import { z } from 'zod';
import { DeviceIdSchema } from '../identity/device-id';
import { UserIdSchema } from '../identity/user-id';
import { ProjectIdSchema } from '../identity/project-id';
import { DeviceStateSchema } from '../domain/device-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A registered device in the Cloud.
 *
 * Each device has a keypair; the public key is stored here.
 * The private key never leaves the device.
 *
 * `meshNodeId` is our mesh node ID for this device.
 */
export const DeviceRole = {
  ADMIN: 'admin',
  USER: 'user',
  CLOUD_SERVICE: 'cloud_service',
  OPS: 'ops',
} as const;

export type DeviceRole = (typeof DeviceRole)[keyof typeof DeviceRole];

export const DeviceSchema = z.object({
  deviceId: DeviceIdSchema,
  ownerUserId: UserIdSchema, // the user who registered this device
  projectId: ProjectIdSchema.optional(), // null for ops / cloud devices
  role: z.nativeEnum(DeviceRole),
  publicKey: z.string(), // base64-encoded ed25519 public key
  state: DeviceStateSchema,
  tailscaleNodeId: z.string().optional(),
  displayName: z.string().min(1).max(256),
  createdAt: TimestampSchema,
  lastSeenAt: TimestampSchema.optional(),
  replacedByDeviceId: DeviceIdSchema.optional(), // set when REPLACED
  revokedAt: TimestampSchema.optional(),
  revokedReason: z.string().optional(),
});

export type Device = z.infer<typeof DeviceSchema>;
```

Update `product/packages/contracts/src/identity-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/identity-domain/device.ts || { echo "FAIL"; exit 1; }
grep -q "publicKey" packages/contracts/src/identity-domain/device.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
