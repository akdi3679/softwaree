import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';

export function LoginPage() {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await invoke<{ admin_id: string; display_name: string; session_token: string }>('login_admin', { passphrase });
      localStorage.setItem('admin_session', result.session_token);
      navigate({ to: '/' });
    } catch (err) { setError(String(err)); }
  }
  return (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <form onSubmit={onSubmit} className="w-96 p-6 bg-white rounded border shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Admin sign in</h1>
        <input type="password" placeholder="Device passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded" autoFocus />
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={!passphrase} className="w-full px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">Sign in</button>
      </form>
    </div>
  );
}
