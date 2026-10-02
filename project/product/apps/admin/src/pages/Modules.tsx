import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useInstalledModules, useAvailableModules, useInstallModule } from '../hooks/useModules';

export function ModulesPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: installed } = useInstalledModules(projectId ?? null);
  const { data: available } = useAvailableModules(projectId ?? null);
  const install = useInstallModule(projectId ?? '');
  const [tab, setTab] = useState<'installed' | 'available'>('installed');
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Modules</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('installed')} className={`px-3 py-1 rounded text-sm ${tab === 'installed' ? 'bg-primary-600 text-white' : 'bg-white border'}`}>Installed</button>
        <button onClick={() => setTab('available')} className={`px-3 py-1 rounded text-sm ${tab === 'available' ? 'bg-primary-600 text-white' : 'bg-white border'}`}>Available</button>
      </div>
      {tab === 'installed' ? (
        <div className="bg-white rounded border">{(installed ?? []).map((m) => <div key={m.id} className="px-4 py-3 border-b"><div className="font-medium">{m.name}</div><div className="text-sm text-gray-500">{m.module_id} · v{m.version} · {m.state}</div></div>)}</div>
      ) : (
        <div className="bg-white rounded border">{(available ?? []).map((m) => <div key={m.module_id} className="px-4 py-3 border-b flex justify-between"><div><div className="font-medium">{m.name}</div><div className="text-sm text-gray-500">{m.description}</div></div><button onClick={() => install.mutate({ moduleId: m.module_id, version: m.latest_version })} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Install</button></div>)}</div>
      )}
    </div>
  );
}
