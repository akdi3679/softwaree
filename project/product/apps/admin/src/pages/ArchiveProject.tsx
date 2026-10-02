import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

export function ArchiveProjectPage() {
  const nav = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    if (confirm !== 'archive') return;
    setBusy(true);
    try {
      await invoke('archive_project', { projectId: 'current' });
      nav({ to: '/projects' });
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">Archive this project</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4 text-sm">
        Archiving marks the project as read-only and schedules it for permanent deletion
        in 30 days. You can restore it any time before then.
      </div>
      <label className="block text-sm font-medium mb-1">Type "archive" to confirm</label>
      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
      <button onClick={archive} disabled={busy || confirm !== 'archive'} className="px-4 py-2 bg-red-600 text-white rounded">
        {busy ? 'Archiving…' : 'Archive project'}
      </button>
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}
