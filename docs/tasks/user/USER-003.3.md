# TASK ID: USER-003.3
# TITLE: Add User AppShell + router + main
# STATUS: pending
# DEPENDENCIES: USER-003.2
# ALLOWED FILES: product/apps/user/src/components/AppShell.tsx, product/apps/user/src/router.tsx, product/apps/user/src/main.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Wire User app shell, router, and entry point.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/AppShell.tsx`:

```typescript
import { Outlet, Link } from '@tanstack/react-router';
import { useMeshStatus } from '../hooks/useConnect';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function AppShell() {
  const { data: status } = useMeshStatus();
  const navigate = useNavigate();

  // Redirect to Connect if no session
  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      navigate({ to: '/connect' });
    }
  }, [navigate]);

  return (
    <div className="h-full flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">Product</div>
        <div className="text-xs text-gray-400">
          {status ? `${status.self_dns_name}` : 'connecting...'}
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-48 bg-gray-100 border-r px-2 py-2">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </aside>
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded text-sm hover:bg-gray-200"
      activeProps={{ className: 'block px-3 py-2 rounded text-sm bg-primary-100 text-primary-900' }}
    >
      {children}
    </Link>
  );
}
```

Create `product/apps/user/src/router.tsx`:

```typescript
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { ConnectPage } from './pages/Connect';
import { UsersPage } from './pages/Users';
import { EventsPage } from './pages/Events';

const rootRoute = createRootRoute({ component: AppShell });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const connectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/connect',
  component: ConnectPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events',
  component: EventsPage,
});

const routeTree = rootRoute.addChildren([indexRoute, connectRoute, usersRoute, eventsRoute]);
export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
```

Create `product/apps/user/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './lib/query-client';
import { router } from './router';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

Create stub `product/apps/user/src/pages/Users.tsx` and `Events.tsx`:

```typescript
// apps/user/src/pages/Users.tsx
import { useUsers } from '../hooks/useProjection';

export function UsersPage() {
  const { data: users } = useUsers();
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Users</h2>
      <div className="bg-white rounded border">
        {(users ?? []).map((u) => (
          <div key={u.id} className="px-4 py-3 border-b last:border-0">
            <div className="font-medium">{u.display_name}</div>
            <div className="text-sm text-gray-500">{u.email} · {u.state}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// apps/user/src/pages/Events.tsx
import { useEventLog } from '../hooks/useProjection';

export function EventsPage() {
  const { data: events } = useEventLog();
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Event log</h2>
      <div className="bg-white rounded border">
        {(events ?? []).map((e: any) => (
          <div key={e.sequence} className="px-4 py-2 border-b last:border-0 font-mono text-xs">
            <span className="text-gray-500">#{e.sequence}</span>{' '}
            <span className="font-medium">{e.event_type}</span>{' '}
            <span className="text-gray-500">on {e.aggregate_type}:{e.aggregate_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `product/apps/user/src/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1_000,
      refetchOnWindowFocus: false,
    },
  },
});
```

Create `product/apps/user/src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; margin: 0; }
```

## TESTS

```bash
cd product
test -f apps/user/src/components/AppShell.tsx || { echo "FAIL"; exit 1; }
test -f apps/user/src/router.tsx || { echo "FAIL: no router"; exit 1; }
test -f apps/user/src/main.tsx || { echo "FAIL: no main"; exit 1; }
grep -q "AppShell" apps/user/src/router.tsx || { echo "FAIL: not wired"; exit 1; }
echo "OK"
```
