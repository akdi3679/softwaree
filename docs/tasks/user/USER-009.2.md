# TASK ID: USER-009.2
# TITLE: Add User attachment gallery UI
# STATUS: pending
# DEPENDENCIES: USER-009.1
# ALLOWED FILES: product/apps/user/src/components/AttachmentGallery.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
UI to view attachments.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/AttachmentGallery.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface Attachment {
  sha256: string;
  filename: string;
  size_bytes: number;
  stored_path: string;
}

export function AttachmentGallery({ aggregateType, aggregateId, attachments }: { aggregateType: string; aggregateId: string; attachments: Attachment[] }) {
  async function openAttachment(att: Attachment) {
    const path = await open({
      defaultPath: att.stored_path,
      multiple: false,
    });
    if (path) {
      // Open with system default app
      // Tauri 2 has a shell plugin for this; for v1, just show the path
      alert(`Open with your system app: ${path}`);
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {attachments.map((a) => (
        <div key={a.sha256} className="bg-white rounded border p-2 cursor-pointer" onClick={() => openAttachment(a)}>
          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">
            📎
          </div>
          <div className="text-xs mt-1 truncate">{a.filename}</div>
          <div className="text-xs text-gray-500">{(a.size_bytes / 1024).toFixed(1)} KB</div>
        </div>
      ))}
      {attachments.length === 0 && (
        <div className="col-span-4 text-sm text-gray-500 p-4 text-center">No attachments</div>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/AttachmentGallery.tsx || { echo "FAIL"; exit 1; }
grep -q "AttachmentGallery" apps/user/src/components/AttachmentGallery.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
