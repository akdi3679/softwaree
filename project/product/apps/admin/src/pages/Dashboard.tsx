import { useLocalProjects } from '../hooks/useProjects';

export function DashboardPage() {
  const { data: projects } = useLocalProjects();
  const recent = (projects ?? []).slice(0, 5);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Projects" value={String(projects?.length ?? 0)} />
        <Stat label="Active" value={String((projects ?? []).filter(p => p.state === 'active').length)} />
        <Stat label="Archived" value={String((projects ?? []).filter(p => p.state === 'archived').length)} />
      </div>
      <div className="mt-6 bg-white rounded border p-4">
        <h3 className="font-medium mb-2">Recent projects</h3>
        {recent.length === 0 ? <p className="text-sm text-gray-500">No projects yet.</p> : (
          <ul>{recent.map((p) => <li key={p.project_id} className="py-1">{p.name} · {p.state}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded border p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-semibold">{value}</div></div>;
}
