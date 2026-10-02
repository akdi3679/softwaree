import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Account {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  status: string;
  createdAt: string;
}

export function AccountsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => api<{ accounts: Account[] }>("/v1/admin/accounts?limit=100"),
  });
  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Accounts</h2>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "8px 16px" }}>Email</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(data?.accounts ?? []).map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "8px 16px" }}>{a.email}</td>
                <td>{a.displayName}</td>
                <td>{a.plan}</td>
                <td>{a.status}</td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}