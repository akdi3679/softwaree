import { Link, Outlet } from "react-router-dom";

export function AdminApp() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#1f2937", color: "white", padding: 16 }}>
        <h1 style={{ fontSize: 18, marginBottom: 16 }}>Cloud Admin</h1>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Link to="/" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Review queue</Link>
          <Link to="/accounts" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Accounts</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}