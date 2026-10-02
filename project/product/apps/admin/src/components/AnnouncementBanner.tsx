import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Announcement {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  dismissible: boolean;
}

export function AnnouncementBanner() {
  const [a, setA] = useState<Announcement | null>(null);

  useEffect(() => {
    invoke<Announcement | null>('get_active_announcement').then(setA).catch(() => setA(null));
  }, []);

  if (!a) return null;
  return (
    <div className={`px-4 py-2 text-sm ${a.severity === 'critical' ? 'bg-red-100 text-red-800' : a.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
      <strong>{a.title}:</strong> {a.body}
    </div>
  );
}
