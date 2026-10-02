import { useEffect, useState } from 'react';

export function useTableNav<T>(items: T[], onOpen: (item: T) => void) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(items.length - 1, a + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter' && items[active]) {
        e.preventDefault();
        onOpen(items[active]);
      } else if (e.key === 'g') {
        setActive(0);
      } else if (e.key === 'G') {
        setActive(items.length - 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [items, active, onOpen]);
  return { active, setActive };
}
