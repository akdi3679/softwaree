use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(tag = "kind")]
pub enum Capability {
    ReadProjection { table: String },
    WriteProjection { table: String },
    ReadAudit,
    WriteAudit,
    ReadProjectMeta,
    GenerateId,
    ReadClock,
}

pub struct CapabilityValidator {
    allowed: HashSet<Capability>,
}

impl CapabilityValidator {
    pub fn from_declared(caps: &[Capability]) -> Self {
        Self { allowed: caps.iter().cloned().collect() }
    }

    pub fn check(&self, cap: &Capability) -> Result<(), String> {
        if self.allowed.contains(cap) {
            Ok(())
        } else {
            Err(format!("capability not granted: {cap:?}"))
        }
    }

    pub fn check_all(&self, caps: &[Capability]) -> Result<(), String> {
        for c in caps {
            self.check(c)?;
        }
        Ok(())
    }
}
