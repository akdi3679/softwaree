use mdns_sd::{ServiceDaemon, ServiceInfo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::error::{AppError, AppResult};

pub const SERVICE_TYPE: &str = "_product-admin._tcp.local.";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvertisedAdmin {
    pub project_id: String,
    pub instance_name: String,
    pub host: String,
    pub port: u16,
}

pub struct MdnsAdvertiser {
    daemon: ServiceDaemon,
    advertised: Arc<RwLock<Vec<AdvertisedAdmin>>>,
}

impl MdnsAdvertiser {
    pub fn start() -> AppResult<Self> {
        let daemon = ServiceDaemon::new()
            .map_err(|e| AppError::Network(format!("mdns daemon: {e}")))?;
        Ok(Self {
            daemon,
            advertised: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Advertise the Admin's sync server on the LAN for a given project.
    /// `instance_name` must be unique on the LAN (typically the project_id).
    pub async fn advertise(
        &self,
        project_id: &str,
        host: &str,
        port: u16,
    ) -> AppResult<()> {
        let instance_name = format!("admin-{project_id}");
        let host_fqdn = format!("{instance_name}.local.");
        let mut props: HashMap<String, String> = HashMap::new();
        props.insert("project_id".to_string(), project_id.to_string());
        props.insert("role".to_string(), "admin".to_string());

        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &instance_name,
            &host_fqdn,
            host,
            port,
            props,
        )
        .map_err(|e| AppError::Network(format!("mdns service info: {e}")))?;

        self.daemon
            .register(service_info)
            .map_err(|e| AppError::Network(format!("mdns register: {e}")))?;

        let mut list = self.advertised.write().await;
        list.push(AdvertisedAdmin {
            project_id: project_id.to_string(),
            instance_name,
            host: host.to_string(),
            port,
        });
        Ok(())
    }

    pub async fn advertised(&self) -> Vec<AdvertisedAdmin> {
        self.advertised.read().await.clone()
    }
}
