# TASK ID: ADMIN-010.6
# TITLE: Add Modules page
# STATUS: pending
# DEPENDENCIES: ADMIN-010.5
# ALLOWED FILES: product/apps/admin/src/pages/Modules.tsx, product/apps/admin/src/hooks/useModules.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the Modules page — list installed modules, install new ones.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useModules.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface InstalledModule {
  id: string;
  module_id: string;
  name: string;
  version: string;
  state: string;
  installed_at: string;
}

export interface AvailableModule {
  module_id: string;
  name: string;
  latest_version: string;
  description: string;
}

export function useInstalledModules(projectId: string | null) {
  return useQuery({
    queryKey: ['modules', 'installed', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<InstalledModule[]>('list_installed_modules', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useAvailableModules(projectId: string | null) {
  return useQuery({
    queryKey: ['modules', 'available', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<AvailableModule[]>('list_available_modules', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useInstallModule(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { moduleId: string; version: string }) => {
      return await invoke<string>('install_module', {
        projectId,
        moduleId: input.moduleId,
        version: input.version,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}
```

Create `product/apps/admin/src/pages/Modules.tsx`:

```typescript
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
        <Tab label="Installed" active={tab === 'installed'} onClick={() => setTab('installed')} />
        <Tab label="Available" active={tab === 'available'} onClick={() => setTab('available')} />
      </div>
      {tab === 'installed' ? (
        <div className="bg-white rounded border">
          {(installed ?? []).map((m) => (
            <div key={m.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-500">{m.module_id} · v{m.version} · {m.state}</div>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Installed</span>
            </div>
          ))}
          {installed?.length === 0 && (
            <div className="p-6 text-center text-gray-500">No modules installed</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded border">
          {(available ?? []).map((m) => (
            <div key={m.module_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-500">{m.module_id} · v{m.latest_version}</div>
                <div className="text-sm text-gray-600 mt-1">{m.description}</div>
              </div>
              <button
                onClick={() => install.mutate({ moduleId: m.module_id, version: m.latest_version })}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
              >
                Install
              </button>
            </div>
          ))}
          {available?.length === 0 && (
            <div className="p-6 text-center text-gray-500">No available modules</div>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-sm ${
        active ? 'bg-primary-600 text-white' : 'bg-white border'
      }`}
    >
      {label}
    </button>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Modules.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/useModules.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
