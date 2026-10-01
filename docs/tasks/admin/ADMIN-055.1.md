# TASK ID: ADMIN-055.1
# TITLE: Add Admin: per-module permission scopes
# STATUS: pending
# DEPENDENCIES: ARCH-018.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/modules/scopes.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Each module declares what it needs; Admin UI shows it to user before install.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/modules/scopes.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Scope {
    ReadPatients,
    WritePatients,
    ReadAppointments,
    WriteAppointments,
    ReadSamples,
    WriteSamples,
    ReadAudit,
    ReadUsers,
    NetworkEgress,
    FilesystemRead,
    FilesystemWrite,
    SpawnSubprocess,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeSet {
    pub required: HashSet<Scope>,
    pub optional: HashSet<Scope>,
}

impl ScopeSet {
    pub fn is_safe(&self) -> Result<(), String> {
        // Network + filesystem write + subprocess = dangerous
        let dangerous: HashSet<Scope> = [Scope::NetworkEgress, Scope::FilesystemWrite, Scope::SpawnSubprocess]
            .iter().cloned().collect();
        let got: HashSet<&Scope> = self.required.intersection(&dangerous).collect();
        if !got.is_empty() {
            return Err(format!("module requires dangerous scopes: {:?}", got));
        }
        Ok(())
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/modules/scopes.rs || { echo "FAIL"; exit 1; }
grep -q "ScopeSet" apps/admin/src-tauri/src/modules/scopes.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
