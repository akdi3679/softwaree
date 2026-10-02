import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Link } from '@tanstack/react-router';

interface SearchResult {
  aggregate_type: string;
  aggregate_id: string;
  title: string;
  body: string;
  rank: number;
}

export function SearchResultsPage({ q }: { q: string }) {
  const { data: results } = useQuery({
    queryKey: ['search', q],
    queryFn: () => invoke<SearchResult[]>('global_search', { query: q }),
    enabled: q.length >= 2,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Search results for &quot;{q}&quot;</h2>
      <div className="space-y-2">
        {(results ?? []).map((r) => (
          <Link
            key={`${r.aggregate_type}-${r.aggregate_id}`}
            to="/search"
            className="block bg-white rounded border p-3 hover:bg-gray-50"
          >
            <div className="text-xs text-gray-500 uppercase">{r.aggregate_type}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-500">{r.body}</div>
          </Link>
        ))}
        {results?.length === 0 && <div className="text-sm text-gray-500">No matches</div>}
      </div>
    </div>
  );
}