import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  route?: string;
  action?: () => void;
}

const COMMANDS: Command[] = [
  { id: 'go-dashboard', label: 'Go to Dashboard', shortcut: 'G D', route: '/dashboard' },
  { id: 'go-projects', label: 'Go to Projects', shortcut: 'G P', route: '/projects' },
  { id: 'go-users', label: 'Go to Users', shortcut: 'G U', route: '/users' },
  { id: 'go-audit', label: 'Go to Audit log', shortcut: 'G A', route: '/audit' },
  { id: 'go-settings', label: 'Go to Settings', route: '/settings' },
  { id: 'new-patient', label: 'New patient', shortcut: 'N P', route: '/patients/new' },
  { id: 'new-appointment', label: 'New appointment', shortcut: 'N A', route: '/appointments/new' },
  { id: 'go-search', label: 'Search…', route: '/search' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQ('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;
  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-32" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command…"
          className="w-full px-4 py-3 border-b text-sm"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => { c.route && nav({ to: c.route }); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-sm"
            >
              <span>{c.label}</span>
              {c.shortcut && <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.shortcut}</kbd>}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">No matches</div>}
        </div>
      </div>
    </div>
  );
}
