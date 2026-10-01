# TASK ID: ADMIN-045.1
# TITLE: Add Admin: search across all projects
# STATUS: pending
# DEPENDENCIES: CLOUD-020.2
# ALLOWED FILES: product/apps/admin/src/pages/GlobalSearch.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Search across all of the customer's projects from a top bar.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/GlobalSearch.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDebounce } from '../hooks/useDebounce';
import { invoke } from '@tauri-apps/api/core';

interface Result {
  project_id: string;
  project_name: string;
  aggregate_type: string;
  aggregate_id: string;
  title: string;
  snippet: string;
}

export function GlobalSearchPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 250);
  const [results, setResults] = useState<Result[]>([]);
  useEffect(() => {
    if (debounced.length < 2) { setResults([]); return; }
    let cancelled = false;
    invoke<Result[]>('global_search_across_projects', { q: debounced }).then((r) => { if (!cancelled) setResults(r); });
    return () => { cancelled = true; };
  }, [debounced]);
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Search across all projects</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name, ID, or anything…"
        className="w-full px-3 py-2 border rounded mb-4"
        autoFocus
      />
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="bg-white rounded border p-3 cursor-pointer hover:bg-gray-50"
               onClick={() => nav({ to: '/projects/$id/entities/$type/$entity', params: { id: r.project_id, type: r.aggregate_type, entity: r.aggregate_id } })}>
            <div className="text-xs text-gray-500">{r.project_name} · {r.aggregate_type}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-500 line-clamp-2">{r.snippet}</div>
          </div>
        ))}
        {q.length >= 2 && results.length === 0 && <div className="text-sm text-gray-500">No results</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/GlobalSearch.tsx || { echo "FAIL"; exit 1; }
grep -q "GlobalSearchPage" apps/admin/src/pages/GlobalSearch.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
