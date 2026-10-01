# TASK ID: ADMIN-014.3
# TITLE: Add Admin command palette (search-everything)
# STATUS: pending
# DEPENDENCIES: ADMIN-014.2
# ALLOWED FILES: product/apps/admin/src/pages/CommandPalette.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Cmd+K opens a search-everything palette.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/CommandPalette.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

const ALL_COMMANDS: Command[] = [
  { id: 'go-dashboard', label: 'Go to dashboard', shortcut: 'g d', action: () => {} },
  { id: 'go-projects', label: 'Go to projects', shortcut: 'g p', action: () => {} },
  { id: 'go-users', label: 'Go to users', shortcut: 'g u', action: () => {} },
  { id: 'go-audit', label: 'Go to audit log', shortcut: 'g a', action: () => {} },
  { id: 'new-project', label: 'New project', shortcut: '⌘N', action: () => {} },
  { id: 'invite-user', label: 'Invite user', shortcut: '⌘⇧N', action: () => {} },
  { id: 'backup', label: 'Create backup', action: () => {} },
  { id: 'restore', label: 'Restore from backup', action: () => {} },
  { id: 'settings', label: 'Settings', shortcut: '⌘,', action: () => {} },
  { id: 'help', label: 'Help', shortcut: '⌘/', action: () => {} },
];

export function CommandPalettePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const filtered = ALL_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') navigate({ to: '/' });
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-32 z-50" onClick={() => navigate({ to: '/' })}>
      <div className="w-[600px] bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search..."
          className="w-full px-4 py-3 text-lg border-b"
        />
        <div className="max-h-96 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => { c.action(); navigate({ to: '/' }); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
            >
              <span>{c.label}</span>
              {c.shortcut && <kbd className="text-xs text-gray-500">{c.shortcut}</kbd>}
            </button>
          ))}
          {filtered.length === 0 && <div className="p-4 text-sm text-gray-500">No results</div>}
        </div>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/CommandPalette.tsx || { echo "FAIL"; exit 1; }
grep -q "ALL_COMMANDS" apps/admin/src/pages/CommandPalette.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
