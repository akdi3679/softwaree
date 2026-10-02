import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Cell { day: string; hour: number; count: number; }

export function ActivityHeatmap({ projectId }: { projectId: string }) {
  const { data: cells } = useQuery({
    queryKey: ['heatmap', projectId],
    queryFn: async () => {
      return await invoke<Cell[]>('activity_heatmap', { projectId, days: 90 });
    },
  });
  const days = [...new Set((cells ?? []).map((c) => c.day))].sort();
  const cellMap = new Map((cells ?? []).map((c) => [`${c.day}-${c.hour}`, c.count]));
  const max = Math.max(1, ...(cells ?? []).map((c) => c.count));
  function color(count: number): string {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / max;
    if (intensity < 0.25) return 'bg-green-200';
    if (intensity < 0.5) return 'bg-green-400';
    if (intensity < 0.75) return 'bg-green-600';
    return 'bg-green-800';
  }
  return (
    <div className="bg-white rounded border p-4 overflow-x-auto">
      <h3 className="font-medium mb-3">Activity (last 90 days)</h3>
      <div className="flex gap-px">
        {days.map((d) => (
          <div key={d} className="flex flex-col gap-px">
            {Array.from({ length: 24 }).map((_, h) => {
              const count = cellMap.get(`${d}-${h}`) ?? 0;
              return <div key={h} className={`w-3 h-3 ${color(count)}`} title={`${d} ${h}:00 — ${count}`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
