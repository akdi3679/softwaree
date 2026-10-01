# TASK ID: USER-005.3
# TITLE: Add User disconnect notification
# STATUS: pending
# DEPENDENCIES: USER-005.2
# ALLOWED FILES: product/apps/user/src/components/ConnectionStatus.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show connection status to the user — connected/disconnected/connecting with a banner.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/hooks/useConnectionStatus.ts`:

```typescript
import { useEffect, useState } from 'react';
import { useSyncClient } from '../hooks/useConnect';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export function useConnectionStatus(): ConnectionStatus {
  // Read from localStorage / context
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    const session = localStorage.getItem('session_id');
    return session ? 'connecting' : 'disconnected';
  });

  useEffect(() => {
    // Listen for sync events
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onError = () => setStatus('error');
    window.addEventListener('sync:connected', onConnect);
    window.addEventListener('sync:disconnected', onDisconnect);
    window.addEventListener('sync:error', onError);
    return () => {
      window.removeEventListener('sync:connected', onConnect);
      window.removeEventListener('sync:disconnected', onDisconnect);
      window.removeEventListener('sync:error', onError);
    };
  }, []);

  return status;
}
```

Create `product/apps/user/src/components/ConnectionStatus.tsx`:

```typescript
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export function ConnectionStatusBanner() {
  const status = useConnectionStatus();
  if (status === 'connected') return null;

  const messages: Record<string, { text: string; color: string }> = {
    disconnected: { text: 'Not connected. Click "Connect" in the sidebar.', color: 'bg-yellow-100 text-yellow-900' },
    connecting: { text: 'Connecting...', color: 'bg-blue-100 text-blue-900' },
    error: { text: 'Connection error. Retrying...', color: 'bg-red-100 text-red-900' },
  };
  const m = messages[status] ?? messages.disconnected;

  return (
    <div className={`${m.color} px-4 py-2 text-sm`}>
      {m.text}
    </div>
  );
}
```

Update `AppShell.tsx` to include the banner.

## TESTS

```bash
cd product
test -f apps/user/src/components/ConnectionStatus.tsx || { echo "FAIL"; exit 1; }
test -f apps/user/src/hooks/useConnectionStatus.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
