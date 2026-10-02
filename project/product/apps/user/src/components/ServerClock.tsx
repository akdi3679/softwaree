import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
export function ServerClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { let cancelled = false; async function sync() { const offset = await invoke<number>('get_clock_offset_ms'); if (!cancelled) setNow(new Date(Date.now() + offset)); } sync(); const id = setInterval(sync, 60_000); return () => { cancelled = true; clearInterval(id); }; }, []);
  useEffect(() => { if (!now) return; const id = setInterval(() => setNow(new Date(Date.now() + ((now.getTime() - Date.now())))), 1000); return () => clearInterval(id); }, [now]);
  if (!now) return <span>—</span>;
  return <span>{now.toLocaleTimeString()}</span>;
}
