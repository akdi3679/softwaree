# TASK ID: ADMIN-009.6
# TITLE: Add Dashboard page and wire into router
# STATUS: pending
# DEPENDENCIES: ADMIN-009.5
# ALLOWED FILES: product/apps/admin/src/pages/Dashboard.tsx, product/apps/admin/src/router.tsx, product/apps/admin/src/main.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the Dashboard page and wire everything into the router.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Dashboard.tsx`:

```typescript
import { useLocalProjects } from '../hooks/useProjects';

export function DashboardPage() {
  const { data: projects } = useLocalProjects();
  const recent = (projects ?? []).slice(0, 5);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Projects" value={String(projects?.length ?? 0)} />
        <Stat label="Active" value={String((projects ?? []).filter(p => p.state === 'active').length)} />
        <Stat label="Archived" value={String((projects ?? []).filter(p => p.state === 'archived').length)} />
      </div>
      <div className="mt-6 bg-white rounded border p-4">
        <h3 className="font-medium mb-2">Recent projects</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">No projects yet. Go to Projects to create one.</p>
        ) : (
          <ul>
            {recent.map((p) => (
              <li key={p.project_id} className="py-1">
                <span className="font-medium">{p.name}</span> · {p.state}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
```

Replace `product/apps/admin/src/router.tsx`:

```typescript
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { UsersPage } from './pages/Users';

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ProjectsPage,
});

const projectsIndexRoute = createRoute({
  getParentRoute: () => projectsRoute,
  path: '/',
  component: ProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => projectsRoute,
  path: '/$projectId',
  component: ProjectsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectsRoute.addChildren([projectsIndexRoute, projectDetailRoute]),
  usersRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

Replace `product/apps/admin/src/main.tsx`:

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

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Dashboard.tsx || { echo "FAIL"; exit 1; }
grep -q "DashboardPage" apps/admin/src/router.tsx || { echo "FAIL: not in router"; exit 1; }
grep -q "RouterProvider" apps/admin/src/main.tsx || { echo "FAIL: not in main"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
