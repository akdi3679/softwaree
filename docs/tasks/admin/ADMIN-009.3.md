# TASK ID: ADMIN-009.3
# TITLE: Add AppShell component
# STATUS: pending
# DEPENDENCIES: ADMIN-009.2
# ALLOWED FILES: product/apps/admin/src/components/AppShell.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the AppShell component — sidebar + main content area.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/AppShell.tsx`:

```typescript
import { Outlet, Link, useRouterState } from '@tanstack/react-router';

export function AppShell() {
  return (
    <div className="flex h-full">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold">Product Admin</h1>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/projects">Projects</NavItem>
          <NavItem to="/users">Users</NavItem>
          <NavItem to="/modules">Modules</NavItem>
          <NavItem to="/audit">Audit</NavItem>
          <NavItem to="/backup">Backup</NavItem>
        </nav>
        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-400">
          v0.1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded text-sm hover:bg-gray-800"
      activeProps={{ className: 'block px-3 py-2 rounded text-sm bg-gray-800' }}
    >
      {children}
    </Link>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/AppShell.tsx || { echo "FAIL"; exit 1; }
grep -q "AppShell" apps/admin/src/components/AppShell.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
