use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{path::PathResolver, Runtime};

use crate::crypto::device_key::DeviceKey;
use crate::error::AppResult;
use crate::sync::client::SyncClient;

pub struct AppPaths {
    pub data_dir: PathBuf,
    pub keys_dir: PathBuf,
    pub projections_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub tailscale_state: PathBuf,
}

impl AppPaths {
    pub fn new<R: Runtime>(resolver: &PathResolver<R>) -> AppResult<Self> {
        let data_dir = resolver.app_data_dir()?;
        let logs_dir = resolver.app_log_dir()?;
        Ok(Self {
            keys_dir: data_dir.join("keys"),
            projections_dir: data_dir.join("projections"),
            tailscale_state: data_dir.join("tailscale"),
            data_dir,
            logs_dir,
        })
    }
}

pub struct DeviceIdentity { pub device_id: String, pub key: DeviceKey }

pub struct AppState {
    pub paths: AppPaths,
    pub device: Arc<DeviceIdentity>,
    pub sync: Arc<RwLock<Option<SyncClient>>>,
    pub active_projection: Arc<RwLock<Option<crate::db::projection_db::ProjectionDb>>>,
}

impl AppState {
    pub fn new(paths: AppPaths) -> AppResult<Self> {
        std::fs::create_dir_all(&paths.keys_dir)?;
        std::fs::create_dir_all(&paths.projections_dir)?;
        std::fs::create_dir_all(&paths.logs_dir)?;
        let device = crate::crypto::device_identity::load_or_create(&paths.keys_dir)?;
        let device_id = device.public_key_b64();
        let key = device;
        Ok(Self { paths, device: Arc::new(DeviceIdentity { device_id, key }), sync: Arc::new(RwLock::new(None)), active_projection: Arc::new(RwLock::new(None)) })
    }
}
