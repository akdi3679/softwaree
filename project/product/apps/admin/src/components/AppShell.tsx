import { Outlet, Link } from '@tanstack/react-router';

export function AppShell() {
  return (
    <div className="flex h-full">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-800"><h1 className="text-lg font-semibold">Product Admin</h1></div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          <Link to="/" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Dashboard</Link>
          <Link to="/projects" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Projects</Link>
          <Link to="/users" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Users</Link>
          <Link to="/audit" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Audit</Link>
          <Link to="/modules" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Modules</Link>
          <Link to="/backup" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Backup</Link>
          <Link to="/login" className="block px-3 py-2 rounded text-sm hover:bg-gray-800">Login</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50"><Outlet /></main>
    </div>
  );
}
