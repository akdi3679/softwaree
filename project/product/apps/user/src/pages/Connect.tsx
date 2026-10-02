import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMeshStatus, useConnect } from '../hooks/useConnect';

export function ConnectPage() {
  const { data: status } = useMeshStatus();
  const connect = useConnect();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(localStorage.getItem('user_id') ?? '');
  const [authToken, setAuthToken] = useState('');

  const admins = (status?.peers ?? []).filter((p) => p.tags.includes('tag:admin') && p.online);

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Connect to project</h2>
      <div className="mb-4 p-3 bg-white rounded border text-sm">
        <div>Your device: {status?.self_dns_name ?? '...'} ({status?.self_ip ?? '...'})</div>
        <div>Backend state: {status?.backend_state ?? '...'}</div>
      </div>
      <div className="mb-4 p-4 bg-white rounded border">
        <h3 className="font-medium mb-2">Sign in</h3>
        <input type="text" placeholder="User ID" value={userId} onChange={(e) => { setUserId(e.target.value); localStorage.setItem('user_id', e.target.value); }} className="w-full mb-2 px-3 py-2 border rounded" />
        <input type="password" placeholder="Auth token" value={authToken} onChange={(e) => setAuthToken(e.target.value)} className="w-full mb-2 px-3 py-2 border rounded" />
      </div>
      <div className="mb-4 p-4 bg-white rounded border">
        <h3 className="font-medium mb-2">Available Admin devices</h3>
        {admins.length === 0 ? (
          <div className="text-sm text-gray-500">No Admin devices found. Make sure your Admin is online and tagged "tag:admin" on the same tailnet.</div>
        ) : (
          <ul>
            {admins.map((a) => (
              <li key={a.id} className="py-2 border-b last:border-0 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-gray-500">{a.dns_name} · {a.ip}</div>
                </div>
                <button
                  onClick={async () => {
                    const sessionId = await connect.mutateAsync({ host: a.ip, port: 9420, userId, projectId: 'current', authToken });
                    localStorage.setItem('session_id', sessionId);
                    navigate({ to: '/' });
                  }}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
