import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface AuditEntry {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  action: string;
  result: string;
}

export function AuditLogPage() {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { data } = useQuery({
    queryKey: ["portal-audit", page],
    queryFn: () => api<{ entries: AuditEntry[] }>("/v1/admin/audit?limit=" + pageSize + "&offset=" + page * pageSize),
  });
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Audit log</h2>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "8px 16px" }}>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries ?? []).map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "8px 16px" }}>{new Date(e.occurredAt).toLocaleString()}</td>
                <td>{e.actorUserId ?? "-"}</td>
                <td>{e.action}</td>
                <td>{e.result}</td>
              </tr>
            ))}
            {(data?.entries ?? []).length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No entries</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 4, background: "white" }}>Previous</button>
        <span style={{ alignSelf: "center", fontSize: 13, color: "#6b7280" }}>Page {page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 4, background: "white" }}>Next</button>
      </div>
    </div>
  );
}