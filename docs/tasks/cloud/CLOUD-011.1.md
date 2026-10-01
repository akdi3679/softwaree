# TASK ID: CLOUD-011.1
# TITLE: Add Cloud: device revocation propagation
# STATUS: pending
# DEPENDENCIES: SECURITY-005.2
# ALLOWED FILES: platform-cloud/src/devices/revocation.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When a device is revoked on Cloud, broadcast to all other devices in the same project.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/devices/revocation.ts`:

```typescript
import { db } from '../db';
import { broadcaster } from '../sync/broadcast';

export async function revokeDevice(device_id: string, reason: string) {
  await db('devices').where({ id: device_id }).update({
    state: 'revoked',
    revoked_at: new Date().toISOString(),
    revoked_reason: reason,
  });
  // Broadcast to all devices in the same project
  const device = await db('devices').where({ id: device_id }).first();
  if (device) {
    await broadcaster.broadcast(device.project_id, {
      type: 'device.revoked',
      device_id,
      reason,
      revoked_at: new Date().toISOString(),
    });
  }
}
```

## TESTS

```bash
cd platform-cloud
test -f src/devices/revocation.ts || { echo "FAIL"; exit 1; }
grep -q "revokeDevice" src/devices/revocation.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
