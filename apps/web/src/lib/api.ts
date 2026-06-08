/** Minimal typed API client. Endpoints land incrementally with each build step. */

export interface Health {
  status: string;
  uptime: number;
}

const BASE = "/api";

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<Health>;
}
