import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

const COMMANDS = [
  { id: 'go-dashboard', label: 'Go to dashboard', action: '/' },
  { id: 'go-projects', label: 'Go to projects', action: '/projects' },
  { id: 'go-users', label: 'Go to users', action: '/users' },
  { id: 'go-audit', label: 'Go to audit', action: '/audit' },
  { id: 'go-modules', label: 'Go to modules', action: '/modules' },
  { id: 'go-backup', label: 'Go to backup', action: '/backup' },
  { id: 'go-settings', label: 'Go to settings', action: '/settings' },
];

export function CommandPalettePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') navigate({ to: '/' });
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50" onClick={() => navigate({ to: '/' })}>
      <div className="w-[600px] bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a command or search..." className="w-full px-4 py-3 text-lg border-b" />
        <div className="max-h-96 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => { navigate({ to: c.action }); }} className="w-full px-4 py-2 text-left hover:bg-gray-100">{c.label}</button>
          ))}
          {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No results</div>}
        </div>
      </div>
    </div>
  );
}
