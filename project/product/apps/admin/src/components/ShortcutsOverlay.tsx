import { useEffect, useState } from 'react';

const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Ctrl', 'K'], desc: 'Open command palette' },
  { keys: ['G', 'D'], desc: 'Go to Dashboard' },
  { keys: ['G', 'P'], desc: 'Go to Projects' },
  { keys: ['G', 'U'], desc: 'Go to Users' },
  { keys: ['G', 'A'], desc: 'Go to Audit' },
  { keys: ['Esc'], desc: 'Close dialog / go back' },
];

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Keyboard shortcuts</h2>
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map((s, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">
                  {s.keys.map((k, j) => <kbd key={j} className="px-2 py-1 bg-gray-100 rounded text-xs font-mono mr-1">{k}</kbd>)}
                </td>
                <td className="py-2 text-gray-600">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-xs text-gray-500">Press ? or Esc to close</div>
      </div>
    </div>
  );
}
