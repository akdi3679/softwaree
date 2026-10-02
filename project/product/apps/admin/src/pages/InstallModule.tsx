import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

export function InstallModulePage() {
  const nav = useNavigate();
  const [manifest, setManifest] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function install() {
    setError(null);
    let m: any;
    try { m = JSON.parse(manifest); }
    catch (e: any) { setError(`Invalid JSON: ${e.message}`); return; }
    setBusy(true);
    try {
      await invoke<{ module_id: string; version: string }>('install_module_from_manifest', { manifest: m });
      nav({ to: '/modules' });
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Install module from manifest</h2>
      <p className="text-sm text-gray-500 mb-4">Paste the JSON manifest from the module publisher. The triple-signature will be verified before install.</p>
      <textarea value={manifest} onChange={(e) => setManifest(e.target.value)} rows={15} className="w-full px-3 py-2 border rounded font-mono text-xs mb-3" />
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <button onClick={install} disabled={busy || !manifest} className="px-4 py-2 bg-primary-600 text-white rounded">
        {busy ? 'Installing…' : 'Install'}
      </button>
    </div>
  );
}
