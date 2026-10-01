# TASK ID: ADMIN-070.1
# TITLE: Add Admin: pin / unpin dashboard widgets
# STATUS: pending
# DEPENDENCIES: ADMIN-069.2
# ALLOWED FILES: product/apps/admin/src/hooks/useDashboardLayout.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can rearrange / hide dashboard widgets. Saved per user.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useDashboardLayout.ts`:

```typescript
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'product.admin.dashboard.layout';

const DEFAULT_LAYOUT = {
  today: { visible: true, order: 0 },
  patients_recent: { visible: true, order: 1 },
  appointments_upcoming: { visible: true, order: 2 },
  backup_status: { visible: true, order: 3 },
  activity_heatmap: { visible: true, order: 4 },
  events_ticker: { visible: true, order: 5 },
};

type Layout = typeof DEFAULT_LAYOUT;

export function useDashboardLayout() {
  const [layout, setLayout] = useState<Layout>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? DEFAULT_LAYOUT; }
    catch { return DEFAULT_LAYOUT; }
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)), [layout]);
  function toggle(key: keyof Layout) {
    setLayout((l) => ({ ...l, [key]: { ...l[key], visible: !l[key].visible } }));
  }
  function reorder(key: keyof Layout, newOrder: number) {
    setLayout((l) => ({ ...l, [key]: { ...l[key], order: newOrder } }));
  }
  return { layout, toggle, reorder, reset: () => setLayout(DEFAULT_LAYOUT) };
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useDashboardLayout.ts || { echo "FAIL"; exit 1; }
grep -q "useDashboardLayout" apps/admin/src/hooks/useDashboardLayout.ts || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
