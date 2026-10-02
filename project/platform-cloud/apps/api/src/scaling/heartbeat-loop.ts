import { heartbeat } from "./cluster";

const INTERVAL_MS = 10_000;

export function startHeartbeatLoop(): void {
  setInterval(() => {
    heartbeat().catch((e) => {
      console.error("[scaling] heartbeat failed:", e);
    });
  }, INTERVAL_MS);
  heartbeat().catch((e) => {
    console.error("[scaling] initial heartbeat failed:", e);
  });
}