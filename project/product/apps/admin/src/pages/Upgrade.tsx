import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$29/mo', users: 3, projects: 1, backups: 'Weekly' },
  { id: 'team', name: 'Team', price: '$99/mo', users: 10, projects: 5, backups: 'Daily' },
  { id: 'enterprise', name: 'Enterprise', price: '$499+/mo', users: 'Unlimited', projects: 'Unlimited', backups: 'Every 4h' },
];

export function UpgradePage() {
  const [busy, setBusy] = useState<string | null>(null);
  async function go(plan: string) {
    setBusy(plan);
    try {
      await invoke('start_checkout', { plan });
    } catch (e: any) { alert(e.message); } finally { setBusy(null); }
  }
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">Upgrade your plan</h2>
      <p className="text-sm text-gray-500 mb-6">All plans are monthly. You can downgrade any time. You only pay the difference for the rest of the month.</p>
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className="bg-white rounded border p-4 flex flex-col">
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="text-2xl font-bold my-2">{p.price}</div>
            <ul className="text-sm text-gray-600 space-y-1 flex-1">
              <li>· {p.users} users</li>
              <li>· {p.projects} projects</li>
              <li>· {p.backups} backups</li>
              <li>· Marketplace access</li>
            </ul>
            <button onClick={() => go(p.id)} disabled={busy !== null} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded text-sm">
              {busy === p.id ? 'Loading…' : 'Choose'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
