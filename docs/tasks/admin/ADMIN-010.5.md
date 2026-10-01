# TASK ID: ADMIN-010.5
# TITLE: Add Audit page (read-only viewer)
# STATUS: pending
# DEPENDENCIES: ADMIN-010.4
# ALLOWED FILES: product/apps/admin/src/pages/Audit.tsx, product/apps/admin/src/hooks/useAudit.ts, product/apps/admin/src-tauri/src/commands/audit.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the Audit page — read-only viewer of the audit log.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/audit.rs`:

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: i64,
    pub occurred_at: String,
    pub actor_user_id: Option<String>,
    pub action: String,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub result: String,
    pub details: Option<String>,
}

#[tauri::command]
pub async fn list_audit_entries(
    state: State<'_, AppState>,
    project_id: String,
    limit: i64,
    offset: i64,
) -> AppResult<Vec<AuditEntry>> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let rows: Vec<(i64, String, Option<String>, String, Option<String>, Option<String>, String, Option<String>)> = sqlx::query_as(
        r#"
        SELECT id, occurred_at, actor_user_id, action, target_type, target_id, result, details
        FROM audit_entries
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&handle.db)
    .await?;
    Ok(rows.into_iter().map(|r| AuditEntry {
        id: r.0, occurred_at: r.1, actor_user_id: r.2, action: r.3,
        target_type: r.4, target_id: r.5, result: r.6, details: r.7,
    }).collect())
}
```

Create `product/apps/admin/src/hooks/useAudit.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface AuditEntry {
  id: number;
  occurred_at: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  result: string;
  details: string | null;
}

export function useAuditEntries(projectId: string | null, limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['audit', projectId, limit, offset],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<AuditEntry[]>('list_audit_entries', { projectId, limit, offset });
    },
    enabled: !!projectId,
  });
}
```

Create `product/apps/admin/src/pages/Audit.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useAuditEntries } from '../hooks/useAudit';

export function AuditPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: entries } = useAuditEntries(projectId ?? null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Audit log</h2>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((e) => (
              <tr key={e.id} className="border-b">
                <td className="px-4 py-2 font-mono text-xs">{e.occurred_at}</td>
                <td className="px-4 py-2">{e.actor_user_id ?? '-'}</td>
                <td className="px-4 py-2 font-medium">{e.action}</td>
                <td className="px-4 py-2 text-gray-500">
                  {e.target_type ? `${e.target_type}:${e.target_id ?? '?'}` : '-'}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    e.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {e.result}
                  </span>
                </td>
              </tr>
            ))}
            {entries?.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No audit entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

Wire into `product/apps/admin/src-tauri/src/lib.rs` and `product/apps/admin/src/router.tsx`.

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Audit.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/useAudit.ts || { echo "FAIL: no hook"; exit 1; }
test -f apps/admin/src-tauri/src/commands/audit.rs || { echo "FAIL: no command"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
