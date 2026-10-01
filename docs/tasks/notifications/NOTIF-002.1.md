# TASK ID: NOTIF-002.1
# TITLE: Add notification: web push for Admin
# STATUS: pending
# DEPENDENCIES: EMAIL-002.2
# ALLOWED FILES: platform-cloud/notifications/web_push.ts, product/apps/admin/src-tauri/src/notifications/web_push.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Cloud can send web push to the Admin's browser.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/notifications/web_push.ts`:

```typescript
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendWebPush(opts: { subscription: webpush.PushSubscription; title: string; body: string; data?: any }) {
  await webpush.sendNotification(
    opts.subscription,
    JSON.stringify({ title: opts.title, body: opts.body, data: opts.data ?? {} }),
  );
}
```

Create `product/apps/admin/src-tauri/src/notifications/web_push.rs`:

```rust
// Stores the browser PushSubscription locally so Cloud can target it
use sqlx::SqlitePool;
use crate::error::AppResult;

pub async fn store_subscription(pool: &SqlitePool, json: &str) -> AppResult<()> {
    sqlx::query("INSERT OR REPLACE INTO push_subscriptions (id, subscription_json, created_at) VALUES (1, ?, CURRENT_TIMESTAMP)")
        .bind(json).execute(pool).await?;
    Ok(())
}
```

Add migration `006_push_subscriptions.sql`:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY,
  subscription_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## TESTS

```bash
cd platform-cloud
test -f notifications/web_push.ts || { echo "FAIL"; exit 1; }
grep -q "sendWebPush" notifications/web_push.ts || { echo "FAIL"; exit 1; }
cd product
test -f apps/admin/src-tauri/src/notifications/web_push.rs || { echo "FAIL: no rust"; exit 1; }
echo "OK"
```
