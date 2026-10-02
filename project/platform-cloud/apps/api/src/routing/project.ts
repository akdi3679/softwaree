/// Project → Cloud instance sticky routing.
///
/// In Stage 2+ we may run N stateless Cloud replicas. To keep auth and sync
/// flows local (fewer cross-instance DB hops), requests for the same
/// project_id should land on the same replica when possible.
///
/// V1 uses simple modulo hashing. V2 will use consistent hashing (ring) so
/// adding/removing a replica moves as few projects as possible.

export interface RoutingDecision {
  project_id: string;
  total_replicas: number;
  replica_index: number;
  is_current_instance: boolean;
}

export function instanceForProject(projectId: string, totalReplicas: number): number {
  let hash = 0;
  for (const ch of projectId) {
    hash = ((hash * 31) + ch.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) % Math.max(1, totalReplicas);
}

export function currentReplicaIndex(): number | null {
  const raw = process.env.CLOUD_REPLICA_INDEX;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function routingFor(
  projectId: string,
  totalReplicas: number,
): RoutingDecision {
  const replicaIndex = instanceForProject(projectId, totalReplicas);
  const current = currentReplicaIndex();
  return {
    project_id: projectId,
    total_replicas: totalReplicas,
    replica_index: replicaIndex,
    is_current_instance: current === null ? true : current === replicaIndex,
  };
}

/// Extract a project_id from a request path if present.
/// Recognises `/v1/projects/<id>` and `/v1/projects/<id>/...`.
export function projectIdFromPath(path: string): string | null {
  const m = path.match(/^\/v1\/projects\/([^/]+)/);
  return m?.[1] ?? null;
}