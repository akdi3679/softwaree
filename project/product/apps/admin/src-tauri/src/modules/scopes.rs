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
    /// A module is "safe" if it does not REQUIRE any dangerous scope.
    /// Dangerous scopes may still be requested as optional (opt-in by user).
    pub fn is_safe(&self) -> Result<(), String> {
        let dangerous: HashSet<Scope> = [
            Scope::NetworkEgress,
            Scope::FilesystemWrite,
            Scope::SpawnSubprocess,
        ]
        .iter()
        .cloned()
        .collect();

        let offending: Vec<&Scope> = self
            .required
            .intersection(&dangerous)
            .collect();

        if !offending.is_empty() {
            return Err(format!(
                "required scopes include dangerous capabilities: {:?}",
                offending
            ));
        }
        Ok(())
    }
}