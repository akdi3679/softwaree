# TASK ID: PORTAL-001.2
# TITLE: Add portal React app
# STATUS: pending
# DEPENDENCIES: PORTAL-001.1
# ALLOWED FILES: platform-cloud/portal/index.html, platform-cloud/portal/src/main.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Customer-facing web app that consumes the portal API.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/portal/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Product Portal</title>
  <link rel="stylesheet" href="/src/styles.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Create `platform-cloud/portal/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PortalApp } from './App';
import { Dashboard } from './pages/Dashboard';
import { Team } from './pages/Team';
import { Devices } from './pages/Devices';
import { Billing } from './pages/Billing';
import { Login } from './pages/Login';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PortalApp />}>
          <Route index element={<Dashboard />} />
          <Route path="team" element={<Team />} />
          <Route path="devices" element={<Devices />} />
          <Route path="billing" element={<Billing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
```

Create `platform-cloud/portal/src/App.tsx`:

```typescript
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function PortalApp() {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem('session');
    navigate('/login');
  }
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white p-4">
        <h1 className="text-lg font-semibold mb-4">Product</h1>
        <nav className="space-y-1">
          <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-800">Dashboard</Link>
          <Link to="/team" className="block px-3 py-2 rounded hover:bg-gray-800">Team</Link>
          <Link to="/devices" className="block px-3 py-2 rounded hover:bg-gray-800">Devices</Link>
          <Link to="/billing" className="block px-3 py-2 rounded hover:bg-gray-800">Billing</Link>
        </nav>
        <button onClick={logout} className="mt-8 w-full px-3 py-2 text-sm border border-gray-700 rounded">Sign out</button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f portal/index.html || { echo "FAIL"; exit 1; }
test -f portal/src/main.tsx || { echo "FAIL: no main"; exit 1; }
grep -q "PortalApp" portal/src/main.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
