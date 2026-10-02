import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate({ to: '/command-palette' });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate({ to: '/projects' });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate({ to: '/settings' });
      }
      if (e.key === 'Escape') {
        navigate({ to: '/' });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
}
