# TASK ID: NOTIF-001.1
# TITLE: Add in-app notification center
# STATUS: pending
# DEPENDENCIES: EMAIL-001.2
# ALLOWED FILES: product/apps/admin/src/components/Notifications.tsx, product/apps/admin/src/hooks/useNotifications.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
In-app notification center: bell icon, dropdown, list of recent events.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useNotifications.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  body: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await invoke<Notification[]>('list_notifications');
    },
    refetchInterval: 10_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await invoke<void>('mark_notification_read', { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

Create `product/apps/admin/src/components/Notifications.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { useNotifications, useMarkRead } from '../hooks/useNotifications';

export function NotificationBell() {
  const { data: notifs } = useNotifications();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = (notifs ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative px-3 py-1 text-sm text-gray-700"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded border shadow-lg max-h-96 overflow-y-auto z-50">
          {(notifs ?? []).length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications</div>
          ) : (
            (notifs ?? []).map((n) => (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead.mutate(n.id); if (n.action_url) window.location.href = n.action_url; }}
                className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${n.read ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span>{n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : 'ℹ️'}</span>
                  <div>
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-gray-600">{n.body}</div>
                    <div className="text-xs text-gray-400 mt-1">{n.created_at}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

Add the Tauri command in `product/apps/admin/src-tauri/src/commands/notifications.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub r#type: String,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub read: bool,
    pub created_at: String,
}

#[tauri::command]
pub async fn list_notifications(state: State<'_, AppState>) -> AppResult<Vec<Notification>> {
    let db = state.system_db.read().await;
    let db = db.as_ref().ok_or_else(|| AppError::NotFound("system db not open".into()))?;
    let rows: Vec<(String, String, String, String, Option<String>, i64, String)> = sqlx::query_as(
        "SELECT id, type, title, body, action_url, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50"
    ).fetch_all(db).await?;
    Ok(rows.into_iter().map(|(id, ty, title, body, action_url, read, created_at)| Notification {
        id, r#type: ty, title, body, action_url, read: read != 0, created_at,
    }).collect())
}

#[tauri::command]
pub async fn mark_notification_read(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let db = state.system_db.read().await;
    let db = db.as_ref().ok_or_else(|| AppError::NotFound("system db not open".into()))?;
    sqlx::query("UPDATE notifications SET read = 1 WHERE id = ?").bind(id).execute(db).await?;
    Ok(())
}
```

Add `notifications` table to a new migration `004_notifications.sql`:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_time ON notifications(created_at DESC);
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/Notifications.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/useNotifications.ts || { echo "FAIL: no hook"; exit 1; }
test -f apps/admin/src-tauri/migrations/004_notifications.sql || { echo "FAIL: no migration"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
