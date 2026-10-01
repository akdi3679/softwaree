# TASK ID: SEARCH-002.1
# TITLE: Add User: global search across projection
# STATUS: pending
# DEPENDENCIES: ONBOARD-002.2
# ALLOWED FILES: product/apps/user/src/pages/SearchResults.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User searches across all entity types via FTS5.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/SearchResults.tsx`:

```typescript
import { useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Link } from '@tanstack/react-router';

interface SearchResult {
  type: 'patient' | 'appointment' | 'sample' | 'audit';
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

export function SearchResultsPage() {
  const { q } = useSearch({ strict: false }) as { q: string };
  const { data: results } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      return await invoke<SearchResult[]>('global_search', { query: q });
    },
    enabled: q.length >= 2,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Search results for "{q}"</h2>
      <div className="space-y-2">
        {(results ?? []).map((r) => (
          <Link key={`${r.type}-${r.id}`} to={r.route} className="block bg-white rounded border p-3 hover:bg-gray-50">
            <div className="text-xs text-gray-500 uppercase">{r.type}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-500">{r.subtitle}</div>
          </Link>
        ))}
        {results?.length === 0 && <div className="text-sm text-gray-500">No matches</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/SearchResults.tsx || { echo "FAIL"; exit 1; }
grep -q "SearchResultsPage" apps/user/src/pages/SearchResults.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
