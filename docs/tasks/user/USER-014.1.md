# TASK ID: USER-014.1
# TITLE: Add User: read-only favorites/pinning
# STATUS: pending
# DEPENDENCIES: ADMIN-022.2
# ALLOWED FILES: product/apps/user/src/hooks/useFavorites.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can pin frequently viewed patients for quick access. Local only (no sync).

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/hooks/useFavorites.ts`:

```typescript
import { useState, useEffect } from 'react';

const KEY = 'product.user.favorites';

function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
function save(v: string[]) { localStorage.setItem(KEY, JSON.stringify(v)); }

export function useFavorites() {
  const [list, setList] = useState<string[]>(load);
  useEffect(() => save(list), [list]);
  return {
    favorites: list,
    isFavorite: (id: string) => list.includes(id),
    toggle: (id: string) => setList((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id]),
    clear: () => setList([]),
  };
}
```

## TESTS

```bash
cd product
test -f apps/user/src/hooks/useFavorites.ts || { echo "FAIL"; exit 1; }
grep -q "useFavorites" apps/user/src/hooks/useFavorites.ts || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
