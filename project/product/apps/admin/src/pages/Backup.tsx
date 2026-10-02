import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useBackups, useCreateBackup } from '../hooks/useBackup';

export function BackupPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: backups } = useBackups(projectId ?? null);
  const createBackup = useCreateBackup(projectId ?? '');
  const [passphrase, setPassphrase] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Backups</h2>
      {projectId && (
        <div className="mb-4 p-4 bg-white rounded border">
          <input type="password" placeholder="Backup passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="w-full mb-2 px-3 py-2 border rounded" />
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full mb-2 px-3 py-2 border rounded" />
          <button onClick={() => createBackup.mutate({ passphrase, note })} disabled={passphrase.length < 8} className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">Create & upload</button>
        </div>
      )}
      <div className="bg-white rounded border">{(backups ?? []).map((b) => <div key={b.id} className="px-4 py-3 border-b"><div className="font-medium">{b.created_at}</div><div className="text-sm text-gray-500">v{b.schema_version} · {b.note ?? 'no note'}</div></div>)}</div>
    </div>
  );
}
