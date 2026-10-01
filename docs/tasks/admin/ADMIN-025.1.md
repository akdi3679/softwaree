# TASK ID: ADMIN-025.1
# TITLE: Add Admin: announcement banner
# STATUS: pending
# DEPENDENCIES: ARCH-007.2
# ALLOWED FILES: product/apps/admin/src/components/AnnouncementBanner.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show a banner for new features, scheduled maintenance, etc.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/AnnouncementBanner.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Announcement {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  dismissible: boolean;
  valid_from: string;
  valid_until: string;
}

const SEVERITY_COLORS = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  critical: 'bg-red-50 border-red-200 text-red-900',
};

export function AnnouncementBanner() {
  const [a, setA] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem('dismissed') ?? '[]')));

  useEffect(() => {
    invoke<Announcement | null>('get_active_announcement').then(setA);
  }, []);

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    localStorage.setItem('dismissed', JSON.stringify([...next]));
  }

  if (!a || dismissed.has(a.id)) return null;
  const now = Date.now();
  if (new Date(a.valid_from).getTime() > now || new Date(a.valid_until).getTime() < now) return null;
  return (
    <div className={`border-b px-4 py-2 ${SEVERITY_COLORS[a.severity]}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <strong>{a.title}</strong>: {a.body}
        </div>
        {a.dismissible && (
          <button onClick={() => dismiss(a.id)} className="text-sm opacity-50 hover:opacity-100">×</button>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/AnnouncementBanner.tsx || { echo "FAIL"; exit 1; }
grep -q "AnnouncementBanner" apps/admin/src/components/AnnouncementBanner.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
