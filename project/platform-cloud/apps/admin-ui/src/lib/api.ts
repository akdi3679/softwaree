const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("ops_session") ?? "";
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}