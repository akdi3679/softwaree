# TASK ID: USER-016.1
# TITLE: Add User: quick filters (chips) on patient list
# STATUS: pending
# DEPENDENCIES: ADMIN-027.2
# ALLOWED FILES: product/apps/user/src/components/QuickFilters.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Tappable chips: All, Today, This Week, Archived, My Favorites.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/QuickFilters.tsx`:

```typescript
import { useFavorites } from '../hooks/useFavorites';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'favorites', label: '★ Favorites' },
  { id: 'archived', label: 'Archived' },
] as const;

export function QuickFilters({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const favs = useFavorites();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTERS.map((f) => {
        const count = f.id === 'favorites' ? favs.favorites.length : undefined;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              active === f.id ? 'bg-primary-600 text-white' : 'bg-white border'
            }`}
          >
            {f.label}
            {count !== undefined && <span className="ml-1 text-xs opacity-70">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/QuickFilters.tsx || { echo "FAIL"; exit 1; }
grep -q "QuickFilters" apps/user/src/components/QuickFilters.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
