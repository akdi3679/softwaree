# TASK ID: USER-018.1
# TITLE: Add User: disconnect / sign out flow
# STATUS: pending
# DEPENDENCIES: ADMIN-034.2
# ALLOWED FILES: product/apps/user/src/pages/SignOut.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can sign out: clears local state, but doesn't delete the projection.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/SignOut.tsx`:

```typescript
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

export function SignOutPage() {
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      await invoke('sign_out');
      // Give a moment for the state to clear
      setTimeout(() => nav({ to: '/onboarding' }), 500);
    })();
  }, [nav]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500">Signing out…</p>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/SignOut.tsx || { echo "FAIL"; exit 1; }
grep -q "SignOutPage" apps/user/src/pages/SignOut.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
