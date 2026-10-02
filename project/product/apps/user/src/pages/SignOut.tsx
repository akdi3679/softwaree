import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';
export function SignOutPage() {
  const nav = useNavigate();
  useEffect(() => { (async () => { await invoke('sign_out'); setTimeout(() => nav({ to: '/connect' }), 500); })(); }, [nav]);
  return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-sm text-gray-500">Signing out…</p></div></div>;
}
