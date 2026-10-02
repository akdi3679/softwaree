import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface ModuleRow {
  moduleId: string;
  name: string;
  description: string;
  category: string;
  reviewStatus: string;
}

export function ReviewQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api<{ modules: ModuleRow[] }>("/v1/marketplace/modules"),
    refetchInterval: 30_000,
  });
  if (isLoading) return <p>Loading...</p>;
  const pending = (data?.modules ?? []).filter((m) => m.reviewStatus === "pending");
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Module review queue</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.map((m) => (
          <div key={m.moduleId} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12 }}>
            <Link to={`/modules/${m.moduleId}/latest`} style={{ color: "#2563eb", fontWeight: 600 }}>
              {m.name}
            </Link>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {m.moduleId} - {m.category} - {m.reviewStatus}
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6, padding: 24, textAlign: "center", color: "#6b7280" }}>
            Review queue is empty
          </div>
        )}
      </div>
    </div>
  );
}