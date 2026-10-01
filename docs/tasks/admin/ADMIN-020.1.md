# TASK ID: ADMIN-020.1
# TITLE: Add Admin: voice notes (record audio, attach to patient)
# STATUS: pending
# DEPENDENCIES: ARCH-005.2
# ALLOWED FILES: product/apps/admin/src/components/VoiceRecorder.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Doctor can record a voice note while with patient; auto-saves to visit.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/VoiceRecorder.tsx`:

```typescript
import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function VoiceRecorder({ onSaved }: { onSaved: (recordingId: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
    const t0 = Date.now();
    tickRef.current = window.setInterval(() => setDuration(Math.floor((Date.now() - t0) / 1000)), 250);
  }

  async function stop() {
    if (!mediaRef.current) return;
    mediaRef.current.stop();
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setRecording(false);
    setDuration(0);
    // Wait for onstop
    return new Promise<void>((resolve) => {
      mediaRef.current!.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const arr = new Uint8Array(await blob.arrayBuffer());
        const id = await invoke<string>('save_voice_note', { data: Array.from(arr) });
        onSaved(id);
        resolve();
      };
    });
  }

  return (
    <div>
      {recording ? (
        <button onClick={stop} className="px-4 py-2 bg-red-600 text-white rounded animate-pulse">
          ● Stop ({duration}s)
        </button>
      ) : (
        <button onClick={start} className="px-4 py-2 bg-primary-600 text-white rounded">
          🎤 Record
        </button>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/VoiceRecorder.tsx || { echo "FAIL"; exit 1; }
grep -q "VoiceRecorder" apps/admin/src/components/VoiceRecorder.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
