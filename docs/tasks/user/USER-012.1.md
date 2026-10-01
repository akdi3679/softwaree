# TASK ID: USER-012.1
# TITLE: Add User: read-only event timeline (replay)
# STATUS: pending
# DEPENDENCIES: ADMIN-020.2
# ALLOWED FILES: product/apps/user/src/pages/EventTimeline.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Step through every event ever, like a video.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/EventTimeline.tsx`:

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface TimelineEntry {
  sequence: number;
  event_type: string;
  aggregate_id: string;
  occurred_at: string;
  payload: any;
}

export function EventTimelinePage() {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(100);
  const [eventType, setEventType] = useState<string>('');
  const { data } = useQuery({
    queryKey: ['timeline', from, to, eventType],
    queryFn: async () => {
      return await invoke<TimelineEntry[]>('get_event_timeline', { from, to, eventType: eventType || null });
    },
  });
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Event timeline</h2>
      <div className="bg-white rounded border p-3 mb-4 flex gap-2 items-center">
        <label className="text-sm">From seq:</label>
        <input type="number" value={from} onChange={(e) => setFrom(+e.target.value)} className="px-2 py-1 border rounded w-24" />
        <label className="text-sm">To:</label>
        <input type="number" value={to} onChange={(e) => setTo(+e.target.value)} className="px-2 py-1 border rounded w-24" />
        <input type="text" placeholder="Event type filter" value={eventType} onChange={(e) => setEventType(e.target.value)} className="px-2 py-1 border rounded flex-1" />
      </div>
      <div className="space-y-1">
        {(data ?? []).map((e) => (
          <div key={e.sequence} className="bg-white rounded border p-2 text-sm">
            <div className="flex gap-3">
              <span className="font-mono text-gray-500">#{e.sequence}</span>
              <span className="font-medium">{e.event_type}</span>
              <span className="text-gray-500 text-xs">{new Date(e.occurred_at).toLocaleString()}</span>
            </div>
            <details className="mt-1">
              <summary className="text-xs text-gray-500 cursor-pointer">Show payload</summary>
              <pre className="text-xs bg-gray-50 p-2 mt-1 overflow-x-auto">{JSON.stringify(e.payload, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/EventTimeline.tsx || { echo "FAIL"; exit 1; }
grep -q "EventTimelinePage" apps/user/src/pages/EventTimeline.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
