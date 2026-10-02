import { Link, Outlet, useNavigate } from "react-router-dom";

export function PortalApp() {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("portal_session");
    navigate("/login");
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#111827", color: "white", padding: 16 }}>
        <h1 style={{ fontSize: 18, marginBottom: 16 }}>Product</h1>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Link to="/" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Dashboard</Link>
          <Link to="/team" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Team</Link>
          <Link to="/devices" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Devices</Link>
          <Link to="/billing" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Billing</Link>
          <Link to="/audit" style={{ color: "white", padding: "8px 12px", textDecoration: "none" }}>Audit log</Link>
        </nav>
        <button
          onClick={logout}
          style={{ marginTop: 32, width: "100%", padding: "8px 12px", background: "transparent", color: "white", border: "1px solid #374151", borderRadius: 4, cursor: "pointer" }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}