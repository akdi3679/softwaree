# TASK ID: SEARCH-001.2
# TITLE: Add User search UI page
# STATUS: pending
# DEPENDENCIES: SEARCH-001.1
# ALLOWED FILES: product/apps/user/src/pages/Search.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
UI for searching the local projection.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/Search.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await invoke<any[]>('search', { query, limit: 50 });
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Search</h2>
      <input
        type="text"
        autoFocus
        placeholder="Search across the project..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-4"
      />
      {loading && <div className="text-sm text-gray-500">Searching...</div>}
      <div className="space-y-2">
        {results.map((r) => (
          <div key={`${r.aggregate_type}:${r.aggregate_id}`} className="bg-white rounded border p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              if (r.aggregate_type === 'patient') navigate({ to: '/patients' });
              else if (r.aggregate_type === 'sample') navigate({ to: '/samples' });
            }}
          >
            <div className="text-xs text-gray-500">{r.aggregate_type}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-600">{r.body}</div>
            <div className="text-xs text-gray-400">relevance: {r.rank.toFixed(2)}</div>
          </div>
        ))}
        {!loading && query && results.length === 0 && (
          <div className="text-sm text-gray-500">No results</div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/Search.tsx || { echo "FAIL"; exit 1; }
grep -q "useState" apps/user/src/pages/Search.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
