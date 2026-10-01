# TASK ID: ADMIN-014.2
# TITLE: Add Admin keyboard shortcuts
# STATUS: pending
# DEPENDENCIES: ADMIN-014.1
# ALLOWED FILES: product/apps/admin/src/hooks/useKeyboardShortcuts.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Global keyboard shortcuts: Cmd+K for command palette, etc.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd+K / Ctrl+K: command palette (open search)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate({ to: '/search' });
      }
      // Cmd+N: new project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate({ to: '/projects' });
      }
      // Cmd+Shift+N: new user (or patient if medical)
      if ((e.metaKey || e.ctrlKey) && e.key === 'N' && e.shiftKey) {
        e.preventDefault();
        navigate({ to: '/users' });
      }
      // Cmd+, : settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate({ to: '/settings' });
      }
      // Cmd+?: help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        navigate({ to: '/help' });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
}
```

Wire into AppShell.

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useKeyboardShortcuts.ts || { echo "FAIL"; exit 1; }
grep -q "useNavigate" apps/admin/src/hooks/useKeyboardShortcuts.ts || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
