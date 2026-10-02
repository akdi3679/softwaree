import { useConnectionStatus } from '../hooks/useConnectionStatus';

export function ConnectionStatusBanner() {
  const status = useConnectionStatus();
  if (status === 'connected') return null;
  const messages: Record<string, { text: string; color: string }> = {
    disconnected: { text: 'Not connected. Click "Connect" in the sidebar.', color: 'bg-yellow-100 text-yellow-900' },
    connecting: { text: 'Connecting...', color: 'bg-blue-100 text-blue-900' },
    error: { text: 'Connection error. Retrying...', color: 'bg-red-100 text-red-900' },
  };
  const m = messages[status] ?? messages.disconnected;
  return <div className={`${m.color} px-4 py-2 text-sm`}>{m.text}</div>;
}
