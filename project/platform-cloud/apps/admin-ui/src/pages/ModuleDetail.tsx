import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface ModuleDetailResponse {
  module: {
    moduleId: string;
    name: string;
    description: string;
    category: string;
  };
  versions: Array<{ version: string; sha256: string; publishedAt: string }>;
}

export function ModuleDetail() {
  const { id, v } = useParams<{ id: string; v: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["module", id],
    queryFn: () => api<ModuleDetailResponse>(`/v1/marketplace/modules/${id ?? ""}`),
    enabled: Boolean(id),
  });
  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Not found</p>;
  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>{data.module.name}</h2>
      <div style={{ color: "#6b7280", marginBottom: 16 }}>
        {data.module.moduleId} v{v} - {data.module.category}
      </div>
      <p style={{ marginBottom: 16 }}>{data.module.description}</p>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>Versions</h3>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 6 }}>
        {data.versions.map((ver) => (
          <div key={ver.version} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 600 }}>v{ver.version}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>sha256: {ver.sha256}</div>
          </div>
        ))}
      </div>
    </div>
  );
}