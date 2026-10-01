# TASK ID: ANALYTICS-001.1
# TITLE: Add Admin business analytics dashboard
# STATUS: pending
# DEPENDENCIES: A11Y-001.3
# ALLOWED FILES: product/apps/admin/src/pages/Analytics.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Business KPIs: patients per day, appointments per week, samples processed.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Analytics.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { useParams } from '@tanstack/react-router';

export function AnalyticsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: stats } = useQuery({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      return await invoke<AnalyticsStats>('project_analytics', { projectId });
    },
    enabled: !!projectId,
  });

  if (!stats) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPI label="Active patients" value={stats.active_patients} />
        <KPI label="Appointments this week" value={stats.appointments_this_week} />
        <KPI label="Samples this month" value={stats.samples_this_month} />
        <KPI label="Storage (MB)" value={stats.storage_mb} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">Events per day (last 30 days)</h3>
          <SparkBars data={stats.events_per_day} />
        </div>
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">Top event types</h3>
          <ul>
            {stats.top_event_types.map((e) => (
              <li key={e.type} className="py-1 flex justify-between">
                <span>{e.type}</span>
                <span className="text-gray-500">{e.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsStats {
  active_patients: number;
  appointments_this_week: number;
  samples_this_month: number;
  storage_mb: number;
  events_per_day: number[];
  top_event_types: { type: string; count: number }[];
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function SparkBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div key={i} className="flex-1 bg-primary-500" style={{ height: `${(v / max) * 100}%` }} title={`${v}`} />
      ))}
    </div>
  );
}
```

Add Tauri command:

```rust
#[tauri::command]
pub async fn project_analytics(state: State<'_, AppState>, project_id: String) -> AppResult<serde_json::Value> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| AppError::NotFound("project not open".into()))?;
    let active_patients: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM projection_patients WHERE state = 'active'"
    ).fetch_one(&handle.db).await?;
    let _events_per_day: Vec<i64> = (0..30).map(|d| {
        let date = chrono::Utc::now() - chrono::Duration::days(d);
        sqlx::query_scalar("SELECT COUNT(*) FROM events WHERE occurred_at LIKE ?")
            .bind(format!("{}%", date.format("%Y-%m-%d")))
            .fetch_one(&handle.db)
    }).collect::<Vec<_>>().await;
    Ok(serde_json::json!({
        "active_patients": active_patients,
        "appointments_this_week": 0, // TODO
        "samples_this_month": 0,
        "storage_mb": 0,
        "events_per_day": _events_per_day,
        "top_event_types": [],
    }))
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Analytics.tsx || { echo "FAIL"; exit 1; }
grep -q "AnalyticsPage" apps/admin/src/pages/Analytics.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
