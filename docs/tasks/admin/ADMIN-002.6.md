# TASK ID: ADMIN-002.6
# TITLE: Add TanStack Router
# STATUS: pending
# DEPENDENCIES: ADMIN-002.5
# ALLOWED FILES: product/apps/admin/package.json, product/apps/admin/src/router.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add TanStack Router for type-safe file-based routing.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm --filter admin add @tanstack/react-router @tanstack/router-plugin
```

Create `product/apps/admin/src/router.tsx`:

```typescript
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
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

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ProjectsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  projectsRoute,
  usersRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/router.tsx || { echo "FAIL"; exit 1; }
node -e "
const p = require('./apps/admin/package.json');
if (!p.dependencies['@tanstack/react-router']) process.exit(1);
"
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck (expected — page components don't exist yet)"; exit 1; }
echo "OK"
```
