# TASK ID: MODULE-003.2
# TITLE: Add module capability declaration validator
# STATUS: pending
# DEPENDENCIES: MODULE-003.1
# ALLOWED FILES: product/modules/module-sdk/src/capability.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When a module declares capabilities, validate that the Admin can actually grant them.

## REQUIRED IMPLEMENTATION

Update `product/packages/module-sdk/src/capability.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Capability {
    /// Read aggregate projection
    ReadProjection { table: String },
    /// Write aggregate projection
    WriteProjection { table: String },
    /// Read audit log
    ReadAudit,
    /// Write audit log entry
    WriteAudit,
    /// Read project metadata
    ReadProjectMeta,
    /// Generate UUIDs (via host)
    GenerateId,
    /// Get current time (via host)
    ReadClock,
}

pub struct CapabilityValidator {
    allowed: HashSet<Capability>,
}

impl CapabilityValidator {
    pub fn from_declared(caps: &[Capability]) -> Self {
        Self { allowed: caps.iter().cloned().collect() }
    }

    /// Check if a capability is granted. Returns Err if not.
    pub fn check(&self, cap: &Capability) -> Result<(), String> {
        if self.allowed.contains(cap) {
            Ok(())
        } else {
            Err(format!("capability not granted: {:?}", cap))
        }
    }

    /// Check all capabilities in a list.
    pub fn check_all(&self, caps: &[Capability]) -> Result<(), String> {
        for c in caps {
            self.check(c)?;
        }
        Ok(())
    }
}
```

## TESTS

```bash
cd product
test -f packages/module-sdk/src/capability.rs || { echo "FAIL"; exit 1; }
grep -q "CapabilityValidator" packages/module-sdk/src/capability.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
