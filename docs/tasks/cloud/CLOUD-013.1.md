# TASK ID: CLOUD-013.1
# TITLE: Add Cloud: graceful shutdown
# STATUS: pending
# DEPENDENCIES: ARCH-006.2
# ALLOWED FILES: platform-cloud/src/lifecycle/shutdown.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
SIGTERM → finish in-flight requests, close DB, exit cleanly.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/lifecycle/shutdown.ts`:

```typescript
import { db } from '../db';
import { broadcaster } from '../sync/broadcast';

let shuttingDown = false;

export function setupShutdown(server: { close: (cb: () => void) => void }) {
  const handler = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down…`);

    // 1. Stop accepting new requests
    server.close(() => console.log('HTTP server closed'));

    // 2. Wait up to 30s for in-flight requests
    await sleep(30_000);

    // 3. Broadcast "going down" so clients can switch tailnet
    await broadcaster.broadcastAll({
      type: 'cloud.draining',
      signal,
      reconnect_after_ms: 30_000,
    });

    // 4. Close DB connections
    await db.destroy();
    console.log('DB closed');

    process.exit(0);
  };

  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGINT', () => handler('SIGINT'));
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
```

## TESTS

```bash
cd platform-cloud
test -f src/lifecycle/shutdown.ts || { echo "FAIL"; exit 1; }
grep -q "setupShutdown" src/lifecycle/shutdown.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
