import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Device {
  id: string;
  displayName: string;
  state: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export function Devices() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-devices"],
    queryFn: () => api<{ devices: Device[] }>("/v1/portal/devices"),
  });
  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Devices</h2>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        {(data?.devices ?? []).map((d) => (
          <div key={d.id} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{d.displayName}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                last seen {d.lastSeenAt ?? "never"}
              </div>
            </div>
            <span style={{ background: d.state === "active" ? "#dcfce7" : "#fee2e2", color: d.state === "active" ? "#166534" : "#991b1b", padding: "2px 8px", borderRadius: 4, fontSize: 12, alignSelf: "center" }}>
              {d.state}
            </span>
          </div>
        ))}
        {(data?.devices ?? []).length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No devices</div>
        )}
      </div>
    </div>
  );
}