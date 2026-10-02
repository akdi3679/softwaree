//! Mesh ACL: decide whether a discovered mDNS peer is allowed to sync.
//!
//! A peer is accepted if:
//!   1. Its project_id matches this Admin's project.
//!   2. It presents a signed hello whose user_id is a member of this project.
//!   3. Its device is ACTIVE (not revoked, not replaced).
//!
//! For COMM-002 v1 we verify (1) and (2). Device revocation checks are wired
//! in Session 15 (hello_verify.rs) and reused here.

use std::collections::HashSet;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct PeerClaim {
    pub project_id: String,
    pub user_id: String,
    pub device_id: String,
}

pub struct MeshAcl {
    /// Project this Admin serves.
    project_id: String,
    /// User ids authorised to sync with this Admin.
    allowed_users: HashSet<String>,
}

impl MeshAcl {
    pub fn new(project_id: String) -> Self {
        Self {
            project_id,
            allowed_users: HashSet::new(),
        }
    }

    pub fn add_user(&mut self, user_id: String) {
        self.allowed_users.insert(user_id);
    }

    pub fn remove_user(&mut self, user_id: &str) {
        self.allowed_users.remove(user_id);
    }

    /// Check whether a peer's claim is acceptable.
    pub fn check(&self, claim: &PeerClaim) -> AppResult<()> {
        if claim.project_id != self.project_id {
            return Err(AppError::PermissionDenied(format!(
                "peer belongs to project {}, not {}",
                claim.project_id, self.project_id
            )));
        }
        if !self.allowed_users.contains(&claim.user_id) {
            return Err(AppError::PermissionDenied(format!(
                "user {} is not a member of this project",
                claim.user_id
            )));
        }
        // device_id is validated separately by hello_verify against the
        // device registry (Session 15).
        Ok(())
    }
}
