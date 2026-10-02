import { ReactNode, useRef, useState } from 'react';
export function ResizablePanel({ side = 'right', children, defaultWidth = 320 }: { side?: 'left' | 'right'; children: ReactNode; defaultWidth?: number }) {
  const [width, setWidth] = useState(defaultWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(width);
  function onMouseDown(e: React.MouseEvent) { dragging.current = true; startX.current = e.clientX; startW.current = width; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); }
  function onMouseMove(e: MouseEvent) { if (!dragging.current) return; const dx = e.clientX - startX.current; const newW = side === 'right' ? startW.current - dx : startW.current + dx; setWidth(Math.max(200, Math.min(800, newW))); }
  function onMouseUp() { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); }
  return (
    <div className="flex h-full">
      {side === 'left' && <div style={{ width }} className="bg-white border-r overflow-y-auto">{children}</div>}
      <div onMouseDown={onMouseDown} className="w-1 bg-gray-200 hover:bg-primary-400 cursor-col-resize" />
      {side === 'right' && <div style={{ width }} className="bg-white border-l overflow-y-auto">{children}</div>}
    </div>
  );
}
