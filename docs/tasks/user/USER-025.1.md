# TASK ID: USER-025.1
# TITLE: Add User: drag-to-resize side panel
# STATUS: pending
# DEPENDENCIES: ADMIN-064.2
# ALLOWED FILES: product/apps/user/src/components/ResizablePanel.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can drag the divider to resize the side panel.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/ResizablePanel.tsx`:

```typescript
import { ReactNode, useRef, useState } from 'react';

export function ResizablePanel({ side = 'right', children, defaultWidth = 320 }: { side?: 'left' | 'right'; children: ReactNode; defaultWidth?: number }) {
  const [width, setWidth] = useState(defaultWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(width);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const newW = side === 'right' ? startW.current - dx : startW.current + dx;
    setWidth(Math.max(200, Math.min(800, newW)));
  }
  function onMouseUp() {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  return (
    <div className="flex h-full">
      {side === 'left' && (
        <div style={{ width }} className="bg-white border-r overflow-y-auto">{children}</div>
      )}
      <div onMouseDown={onMouseDown} className="w-1 bg-gray-200 hover:bg-primary-400 cursor-col-resize" />
      {side === 'right' && (
        <div style={{ width }} className="bg-white border-l overflow-y-auto">{children}</div>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/ResizablePanel.tsx || { echo "FAIL"; exit 1; }
grep -q "ResizablePanel" apps/user/src/components/ResizablePanel.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
