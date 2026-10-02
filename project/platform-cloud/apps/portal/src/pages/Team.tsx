import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
}

export function Team() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-team"],
    queryFn: () => api<{ team: TeamMember[] }>("/v1/portal/team"),
  });
  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Team</h2>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        {(data?.team ?? []).map((m) => (
          <div key={m.id} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 600 }}>{m.displayName}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{m.email}</div>
          </div>
        ))}
        {(data?.team ?? []).length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No team members</div>
        )}
      </div>
    </div>
  );
}