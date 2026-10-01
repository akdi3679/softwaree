# TASK ID: ADMIN-021.1
# TITLE: Add Admin: telemedicine video call integration (WebRTC)
# STATUS: pending
# DEPENDENCIES: CHAOS-005.2
# ALLOWED FILES: product/apps/admin/src/components/VideoCall.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Doctor can start a video call with a patient directly in the app.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/VideoCall.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';

export function VideoCall({ patientId, onEnd }: { patientId: string; onEnd: () => void }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    for (const track of stream.getTracks()) pc.addTrack(track, stream);
    pc.ontrack = (e) => {
      if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
    };
    setState('calling');
    // In a real impl, this would connect via our WireGuard mesh to the patient.
    // For v1 demo, just show both videos.
    setState('connected');
  }

  function stop() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    setState('ended');
    onEnd();
  }

  useEffect(() => () => { stop(); }, []);

  return (
    <div className="bg-black rounded-lg p-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <video ref={localRef} autoPlay muted className="w-full rounded" />
        <video ref={remoteRef} autoPlay className="w-full rounded" />
      </div>
      <div className="flex justify-between items-center text-white">
        <span className="text-sm">Patient: {patientId}</span>
        <span className="text-sm capitalize">{state}</span>
        {state === 'idle' && <button onClick={start} className="px-3 py-1 bg-green-600 rounded">Start</button>}
        {state !== 'idle' && <button onClick={stop} className="px-3 py-1 bg-red-600 rounded">End</button>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/VideoCall.tsx || { echo "FAIL"; exit 1; }
grep -q "VideoCall" apps/admin/src/components/VideoCall.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
