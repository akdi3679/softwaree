import { db } from '../db/client';

export interface HealthCheck {
  name: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

const start = Date.now();

export async function deepHealth() {
  const checks: HealthCheck[] = [];
  // Postgres
  const t0 = Date.now();
  try {
    await db.execute('SELECT 1');
    checks.push({ name: 'postgres', ok: true, latencyMs: Date.now() - t0 });
  } catch (e: any) {
    checks.push({ name: 'postgres', ok: false, latencyMs: Date.now() - t0, error: e.message });
  }

  return {
    ok: checks.every((c) => c.ok),
    checks,
    version: process.env.VERSION ?? 'dev',
    uptimeS: Math.floor((Date.now() - start) / 1000),
  };
}
