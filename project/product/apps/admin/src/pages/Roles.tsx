import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

const PERMISSIONS = [
  'project.read', 'project.update', 'project.delete',
  'users.invite', 'users.read', 'users.update', 'users.remove',
  'modules.install', 'modules.remove', 'modules.update',
  'patients.read', 'patients.create', 'patients.update', 'patients.archive',
  'appointments.read', 'appointments.create', 'appointments.update', 'appointments.cancel',
  'samples.read', 'samples.create', 'samples.test', 'samples.issue_report',
  'audit.read', 'backups.read', 'backups.create', 'settings.read', 'settings.update',
];

const ROLES = ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'observer', 'billing'];

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  admin: Object.fromEntries(PERMISSIONS.map((p) => [p, true])),
  doctor: Object.fromEntries(PERMISSIONS.map((p) => [p, p !== 'users.remove' && p !== 'project.delete' && !p.startsWith('settings')])),
  nurse: Object.fromEntries(PERMISSIONS.map((p) => [p, p.endsWith('.read') || p.includes('patients.update')])),
  receptionist: Object.fromEntries(PERMISSIONS.map((p) => [p, p.includes('patients') || p.includes('appointments')])),
  lab_tech: Object.fromEntries(PERMISSIONS.map((p) => [p, p.includes('samples')])),
  observer: Object.fromEntries(PERMISSIONS.map((p) => [p, p.endsWith('.read')])),
  billing: Object.fromEntries(PERMISSIONS.map((p) => [p, p === 'project.read' || p === 'users.read' || p === 'backups.read' || p === 'settings.read' || p === 'settings.update'])),
};

export function RolesPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const qc = useQueryClient();
  const { data: matrix } = useQuery({
    queryKey: ['roles', projectId],
    queryFn: async () => await invoke<Record<string, Record<string, boolean>>>('get_role_matrix', { projectId }),
  });
  const save = useMutation({
    mutationFn: async (m: typeof matrix) => await invoke('set_role_matrix', { projectId, matrix: m }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
  const m = matrix ?? DEFAULT_MATRIX;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Roles &amp; permissions</h2>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left sticky left-0 bg-white">Permission</th>
              {ROLES.map((r) => <th key={r} className="px-2 py-2 text-center">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p} className="border-b last:border-0">
                <td className="px-3 py-1 font-mono sticky left-0 bg-white">{p}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={m[r]?.[p] ?? false}
                      onChange={(e) => {
                        const next = { ...m, [r]: { ...m[r], [p]: e.target.checked } };
                        save.mutate(next);
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
