# TASK ID: ADMIN-010.8
# TITLE: Add Login page
# STATUS: pending
# DEPENDENCIES: ADMIN-010.7
# ALLOWED FILES: product/apps/admin/src/pages/Login.tsx, product/apps/admin/src-tauri/src/commands/auth.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the Login page — admin enters passphrase to unlock device.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/auth.rs`:

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub admin_id: String,
    pub display_name: String,
    pub session_token: String,
}

#[tauri::command]
pub async fn login_admin(
    state: State<'_, AppState>,
    passphrase: String,
) -> AppResult<LoginResult> {
    // For v1, single-admin model. In production: hash-checked passphrase.
    if passphrase.is_empty() {
        return Err(AppError::Validation("passphrase required".into()));
    }

    // Generate session token
    let mut token_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut token_bytes);
    let session_token = hex::encode(token_bytes);

    Ok(LoginResult {
        admin_id: "admin".to_string(),
        display_name: "Administrator".to_string(),
        session_token,
    })
}

#[tauri::command]
pub async fn logout_admin(
    state: State<'_, AppState>,
    session_token: String,
) -> AppResult<()> {
    // TODO: invalidate session
    Ok(())
}
```

Create `product/apps/admin/src/pages/Login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';

export function LoginPage() {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<{ admin_id: string; display_name: string; session_token: string }>(
        'login_admin',
        { passphrase },
      );
      localStorage.setItem('admin_session', result.session_token);
      navigate({ to: '/' });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <form onSubmit={onSubmit} className="w-96 p-6 bg-white rounded border shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Admin sign in</h1>
        <input
          type="password"
          placeholder="Device passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
          autoFocus
        />
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading || !passphrase}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Login.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/commands/auth.rs || { echo "FAIL: no command"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
