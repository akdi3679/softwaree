import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Account { id: string; email: string; displayName: string; plan: string; status: string }

export function Dashboard() {
  const { data, error } = useQuery({
    queryKey: ["portal-account"],
    queryFn: () => api<Account>("/v1/portal/account"),
  });
  if (error) return <p style={{ color: "#dc2626" }}>Error: {String(error)}</p>;
  if (!data) return <p>Loading...</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Dashboard</h2>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Signed in as</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{data.displayName}</div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>{data.email}</div>
        <div style={{ marginTop: 12 }}>
          <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{data.plan}</span>
          <span style={{ marginLeft: 8, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{data.status}</span>
        </div>
      </div>
    </div>
  );
}