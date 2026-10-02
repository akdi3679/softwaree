import { useEffect, useState } from 'react';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    const session = localStorage.getItem('session_id');
    return session ? 'connecting' : 'disconnected';
  });
  useEffect(() => {
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onError = () => setStatus('error');
    window.addEventListener('sync:connected', onConnect);
    window.addEventListener('sync:disconnected', onDisconnect);
    window.addEventListener('sync:error', onError);
    return () => {
      window.removeEventListener('sync:connected', onConnect);
      window.removeEventListener('sync:disconnected', onDisconnect);
      window.removeEventListener('sync:error', onError);
    };
  }, []);
  return status;
}
