# TASK ID: ADMIN-076.1
# TITLE: Add Admin: keyboard nav for tables
# STATUS: pending
# DEPENDENCIES: ADMIN-075.2
# ALLOWED FILES: product/apps/admin/src/hooks/useTableNav.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
J/K to move between rows. Enter to open. Esc to back out.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useTableNav.ts`:

```typescript
import { useEffect, useState } from 'react';

export function useTableNav<T>(items: T[], onOpen: (item: T) => void) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(items.length - 1, a + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter' && items[active]) {
        e.preventDefault();
        onOpen(items[active]);
      } else if (e.key === 'g') {
        // first
        setActive(0);
      } else if (e.key === 'G') {
        // last
        setActive(items.length - 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [items, active, onOpen]);
  return { active, setActive };
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useTableNav.ts || { echo "FAIL"; exit 1; }
grep -q "useTableNav" apps/admin/src/hooks/useTableNav.ts || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
