import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function EventCount({ projectId }: { projectId: string }) {
  const { data } = useQuery({
    queryKey: ['event-count', projectId],
    queryFn: async () => {
      return await invoke<{ count: number; last_at: string | null }>('event_count', { projectId });
    },
    refetchInterval: 30_000,
  });
  if (!data) return null;
  return (
    <span className="text-xs text-gray-500">
      {data.count.toLocaleString()} events{data.last_at && ` · last ${new Date(data.last_at).toLocaleDateString()}`}
    </span>
  );
}
