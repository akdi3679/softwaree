import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { useMeshStatus } from '../hooks/useConnect';
import { useEffect } from 'react';

export function AppShell() {
  const { data: status } = useMeshStatus();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) navigate({ to: '/connect' });
  }, [navigate]);

  return (
    <div className="h-full flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">Product</div>
        <div className="text-xs text-gray-400">{status ? `${status.self_dns_name}` : 'connecting...'}</div>
      </header>
      <div className="flex flex-1">
        <aside className="w-48 bg-gray-100 border-r px-2 py-2">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </aside>
        <main className="flex-1 overflow-auto bg-gray-50"><Outlet /></main>
      </div>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="block px-3 py-2 rounded text-sm hover:bg-gray-200" activeProps={{ className: 'block px-3 py-2 rounded text-sm bg-primary-100 text-primary-900' }}>{children}</Link>;
}
