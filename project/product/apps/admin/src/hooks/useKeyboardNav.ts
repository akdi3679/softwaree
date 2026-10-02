import { useEffect, useRef } from 'react';

interface UseKeyboardNavOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  enabled?: boolean;
}

export function useKeyboardNav<T extends HTMLElement>(options: UseKeyboardNavOptions) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (options.enabled === false) return;
    const el = ref.current;
    if (!el) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && options.onEnter) {
        e.preventDefault();
        options.onEnter();
      } else if (e.key === 'Escape' && options.onEscape) {
        e.preventDefault();
        options.onEscape();
      } else if (e.key === 'ArrowUp' && options.onArrowUp) {
        e.preventDefault();
        options.onArrowUp();
      } else if (e.key === 'ArrowDown' && options.onArrowDown) {
        e.preventDefault();
        options.onArrowDown();
      }
    }
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [options]);

  return ref;
}