# TASK ID: USER-023.1
# TITLE: Add User: clock display (server time)
# STATUS: pending
# DEPENDENCIES: ADMIN-054.2
# ALLOWED FILES: product/apps/user/src/components/ServerClock.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show the Admin's clock, not the user's. Reduces confusion.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/ServerClock.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function ServerClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const offset = await invoke<number>('get_clock_offset_ms');
      if (!cancelled) {
        setNow(new Date(Date.now() + offset));
      }
    }
    sync();
    const id = setInterval(sync, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  useEffect(() => {
    if (!now) return;
    const id = setInterval(() => setNow(new Date(Date.now() + ((now.getTime() - Date.now())))), 1000);
    return () => clearInterval(id);
  }, [now]);
  if (!now) return <span>—</span>;
  return <span>{now.toLocaleTimeString()}</span>;
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/ServerClock.tsx || { echo "FAIL"; exit 1; }
grep -q "ServerClock" apps/user/src/components/ServerClock.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
