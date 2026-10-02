import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Invoice {
  id: string;
  amount_paid: number;
  status: string;
  hosted_invoice_url: string | null;
  created: number;
}

export function Billing() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-invoices"],
    queryFn: () => api<{ invoices: Invoice[]; stripe_disabled?: boolean }>("/v1/portal/invoices"),
  });
  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Billing</h2>
      {data?.stripe_disabled && (
        <div style={{ background: "#fef3c7", padding: 12, borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
          Billing is not configured on this environment (STRIPE_SECRET_KEY unset).
        </div>
      )}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "8px 16px" }}>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.invoices ?? []).map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "8px 16px" }}>{new Date(inv.created * 1000).toLocaleDateString()}</td>
                <td>${(inv.amount_paid / 100).toFixed(2)}</td>
                <td>{inv.status}</td>
                <td>
                  {inv.hosted_invoice_url && (
                    <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: 12 }}>View</a>
                  )}
                </td>
              </tr>
            ))}
            {(data?.invoices ?? []).length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No invoices</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}