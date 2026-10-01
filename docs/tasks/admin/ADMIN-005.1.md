# TASK ID: ADMIN-005.1
# TITLE: Add domain layer for User entity
# STATUS: pending
# DEPENDENCIES: ADMIN-004.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/domain/mod.rs, product/apps/admin/src-tauri/src/domain/user.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the Rust domain entity for User (in-project membership, not Cloud account).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/domain/mod.rs`:

```rust
pub mod user;
pub mod role;
pub mod audit;
```

Create `product/apps/admin/src-tauri/src/domain/user.rs`:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,                 // usr_xxx
    pub email: String,
    pub display_name: String,
    pub state: UserState,           // pending_invitation / active / suspended / removed
    pub created_at: DateTime<Utc>,
    pub roles: Vec<String>,         // role names
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserState {
    PendingInvitation,
    PendingApproval,
    Active,
    Suspended,
    Removed,
}

impl UserState {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::PendingInvitation => "pending_invitation",
            Self::PendingApproval => "pending_approval",
            Self::Active => "active",
            Self::Suspended => "suspended",
            Self::Removed => "removed",
        }
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/domain/user.rs || { echo "FAIL"; exit 1; }
grep -q "UserState" apps/admin/src-tauri/src/domain/user.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -3 || { echo "FAIL"; exit 1; }
echo "OK"
```
