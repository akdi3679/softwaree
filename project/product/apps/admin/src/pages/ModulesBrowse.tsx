import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Module {
  module_id: string;
  name: string;
  description: string;
  publisher: string;
  version: string;
  category: string;
  installed: boolean;
  rating: number;
  install_count: number;
}

const CATEGORIES = ['all', 'medical', 'food', 'business', 'education', 'fitness', 'finance', 'other'];

export function ModulesBrowsePage() {
  const qc = useQueryClient();
  const [cat, setCat] = useState('all');
  const { data: modules } = useQuery({
    queryKey: ['marketplace', cat],
    queryFn: async () => {
      return await invoke<Module[]>('browse_marketplace', { category: cat });
    },
  });
  const install = useMutation({
    mutationFn: async (m: { moduleId: string; version: string }) => {
      return await invoke('install_module', m);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  });
  const uninstall = useMutation({
    mutationFn: async (m: { moduleId: string }) => invoke('uninstall_module', m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  });
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Modules marketplace</h2>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${cat === c ? 'bg-primary-600 text-white' : 'bg-white border'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(modules ?? []).map((m) => (
          <div key={m.module_id} className="bg-white rounded border p-4">
            <div className="font-medium">{m.name} <span className="text-xs text-gray-500">v{m.version}</span></div>
            <div className="text-sm text-gray-500 mb-2">by {m.publisher}</div>
            <p className="text-sm mb-3">{m.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">? {m.rating.toFixed(1)} · {m.install_count.toLocaleString()} installs</div>
              {m.installed ? (
                <button onClick={() => uninstall.mutate({ moduleId: m.module_id })} className="px-3 py-1 text-sm border rounded text-red-600">Uninstall</button>
              ) : (
                <button onClick={() => install.mutate({ moduleId: m.module_id, version: m.version })} className="px-3 py-1 text-sm bg-primary-600 text-white rounded">Install</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
