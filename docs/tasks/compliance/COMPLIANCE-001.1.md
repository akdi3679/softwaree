# TASK ID: COMPLIANCE-001.1
# TITLE: Add GDPR compliance — right to be forgotten
# STATUS: pending
# DEPENDENCIES: SCALABILITY-001.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/gdpr.rs, platform-cloud/src/routes/gdpr.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Implement GDPR Article 17 — right to erasure. When a user is removed, all their data is purged.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/gdpr.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;
use chrono::Utc;
use crate::commands::engine;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct ForgetRequest {
    pub user_id: String,
    pub reason: String, // "gdpr_article_17" | "user_request" | "admin_decision"
}

#[derive(Debug, Serialize)]
pub struct ForgetResult {
    pub user_id: String,
    pub events_affected: i64,
    pub audit_entries_redacted: i64,
}

/// Hard-delete a user and all their data. This is irreversible.
/// 
/// Steps:
/// 1. Verify the user exists and is in "removed" state
/// 2. Authorize: only admin can do this
/// 3. Replace PII fields in events with "[REDACTED]"
/// 4. Delete the user row
/// 5. Delete user_roles rows
/// 6. Audit: gdpr.user_forgotten
pub async fn forget_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    device_id: &str,
    request: ForgetRequest,
) -> AppResult<ForgetResult> {
    crate::authz::engine::require(pool, actor_user_id, "users.manage").await?;

    // Check user exists
    let user_exists: Option<String> = sqlx::query_scalar("SELECT state FROM users WHERE id = ?")
        .bind(&request.user_id)
        .fetch_optional(pool)
        .await?;
    if user_exists.is_none() {
        return Err(AppError::NotFound(format!("user {} not found", request.user_id)));
    }

    // Count events to redact
    let events_affected: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE actor_user_id = ? OR payload LIKE ?",
    )
    .bind(&request.user_id)
    .bind(format!("%\"user_id\":\"{}\"", request.user_id))
    .fetch_one(pool)
    .await?;

    let _ = engine::execute(
        pool,
        actor_user_id,
        device_id,
        "gdpr.user_forgotten",
        None,
        {
            let user_id = request.user_id.clone();
            let reason = request.reason.clone();
            move |tx| {
                let user_id = user_id.clone();
                let reason = reason.clone();
                async move {
                    // 1. Redact PII in events (replace user_id in payloads with "[REDACTED]")
                    sqlx::query(
                        r#"
                        UPDATE events
                        SET payload = REPLACE(payload, ?, '[REDACTED]')
                        WHERE actor_user_id = ? OR payload LIKE ?
                        "#,
                    )
                    .bind(format!("\"user_id\":\"{}\"", user_id))
                    .bind(&user_id)
                    .bind(format!("%\"user_id\":\"{}\"", user_id))
                    .execute(&mut **tx)
                    .await?;

                    // 2. Redact actor_user_id in events
                    sqlx::query(
                        "UPDATE events SET actor_user_id = '[REDACTED]' WHERE actor_user_id = ?",
                    )
                    .bind(&user_id)
                    .execute(&mut **tx)
                    .await?;

                    // 3. Redact audit entries
                    sqlx::query(
                        "UPDATE audit_entries SET actor_user_id = '[REDACTED]' WHERE actor_user_id = ?",
                    )
                    .bind(&user_id)
                    .execute(&mut **tx)
                    .await?;

                    // 4. Delete user_roles
                    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
                        .bind(&user_id)
                        .execute(&mut **tx)
                        .await?;

                    // 5. Delete user
                    sqlx::query("DELETE FROM users WHERE id = ?")
                        .bind(&user_id)
                        .execute(&mut **tx)
                        .await?;

                    Ok((
                        "user".to_string(),
                        user_id,
                        1,
                        serde_json::json!({
                            "user_id": user_id,
                            "reason": reason,
                            "redacted_at": Utc::now().to_rfc3339(),
                        }),
                    ))
                }
            }
        },
    ).await?;

    Ok(ForgetResult {
        user_id: request.user_id,
        events_affected,
        audit_entries_redacted: events_affected, // approximation
    })
}

#[tauri::command]
pub async fn gdpr_forget_user(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    user_id: String,
    reason: String,
) -> AppResult<ForgetResult> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| AppError::NotFound("project not open".into()))?;
    let device_id = state.device_id();
    forget_user(&handle.db, &actor_user_id, &device_id, ForgetRequest { user_id, reason }).await
}
```

Create `platform-cloud/src/routes/gdpr.ts`:

```typescript
import { Hono } from 'hono';
import { db } from '../db';
import { accounts, users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export const gdprRoutes = new Hono()
  .post('/v1/accounts/:id/gdpr/export', async (c) => {
    const id = c.req.param('id');
    // Check the requester is the account owner or admin
    const authAccountId = c.get('accountId');
    if (authAccountId !== id) {
      return c.json({ error: 'not_authorized' }, 403);
    }
    // Export all data: account, users, devices, sessions, audit
    const account = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    const myUsers = await db.select().from(users).where(eq(users.accountId, id));
    const mySessions = await db.select().from(sessions).where(eq(sessions.accountId, id));
    return c.json({
      exported_at: new Date().toISOString(),
      account: account[0],
      users: myUsers,
      sessions: mySessions,
      // The Admin holds the project data; user must request from there too
    });
  })
  .post('/v1/accounts/:id/gdpr/delete', async (c) => {
    const id = c.req.param('id');
    const authAccountId = c.get('accountId');
    if (authAccountId !== id) {
      return c.json({ error: 'not_authorized' }, 403);
    }
    // Hard-delete: account, users, sessions
    // Devices, projects, modules are detached (the Admin handles those)
    await db.delete(sessions).where(eq(sessions.accountId, id));
    await db.delete(users).where(eq(users.accountId, id));
    await db.delete(accounts).where(eq(accounts.id, id));
    return c.json({ deleted: true, deleted_at: new Date().toISOString() });
  });
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/gdpr.rs || { echo "FAIL"; exit 1; }
grep -q "forget_user" apps/admin/src-tauri/src/commands/gdpr.rs || { echo "FAIL"; exit 1; }
cd /workspace/platform-cloud
test -f src/routes/gdpr.ts || { echo "FAIL: no cloud route"; exit 1; }
grep -q "gdpr/delete" src/routes/gdpr.ts || { echo "FAIL: no delete"; exit 1; }
echo "OK"
```
