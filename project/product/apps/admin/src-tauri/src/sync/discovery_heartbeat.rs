//! Discovery service heartbeat.
//!
//! Per ADR-020, the Cloud discovery service knows each device's public IP
//! but never sees data. This module sends the periodic heartbeat:
//!
//!   POST /v1/discovery/heartbeat
//!   { device_id, virtual_ip, current_public_ip, current_public_port, state }
//!
//! The Admin signs the body with its device key. The Cloud verifies and
//! stores the mapping. Lookups are done by other devices via /v1/discovery/lookup.

use chrono::Utc;
use ed25519_dalek::Signer;
use serde::Serialize;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize)]
pub struct DiscoveryHeartbeat {
    pub device_id: String,
    pub virtual_ip: String,
    pub current_public_ip: Option<String>,
    pub current_public_port: Option<u16>,
    pub current_ipv6: Option<String>,
    pub state: String, // "lan" | "internet" | "offline" | "unknown"
    pub reachable_methods: Vec<String>,
    pub timestamp: String,
    pub signature: String,
}

#[derive(Clone)]
pub struct DiscoveryConfig {
    pub cloud_base_url: String,
    pub device_id: String,
    pub virtual_ip: String,
    pub signing_key: Arc<ed25519_dalek::SigningKey>,
}

pub async fn send_heartbeat(
    http: &reqwest::Client,
    cfg: &DiscoveryConfig,
    auth_token: &str,
    public_ip: Option<String>,
    public_port: Option<u16>,
    ipv6: Option<String>,
    state: &str,
    reachable_methods: Vec<String>,
) -> AppResult<()> {
    let timestamp = Utc::now().to_rfc3339();
    let unsigned = format!(
        "{}|{}|{}|{}|{}|{}|{}",
        cfg.device_id,
        cfg.virtual_ip,
        public_ip.as_deref().unwrap_or(""),
        public_port.map(|p| p.to_string()).unwrap_or_default(),
        state,
        reachable_methods.join(","),
        timestamp
    );
    let signature = cfg.signing_key.sign(unsigned.as_bytes());

    let body = DiscoveryHeartbeat {
        device_id: cfg.device_id.clone(),
        virtual_ip: cfg.virtual_ip.clone(),
        current_public_ip: public_ip,
        current_public_port: public_port,
        current_ipv6: ipv6,
        state: state.to_string(),
        reachable_methods,
        timestamp,
        signature: hex::encode(signature.to_bytes()),
    };

    let url = format!("{}/v1/discovery/heartbeat", cfg.cloud_base_url);
    let resp = http
        .post(&url)
        .bearer_auth(auth_token)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("discovery heartbeat: {e}")))?;
    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(AppError::Network(format!(
            "discovery heartbeat {status}: {text}"
        )));
    }
    Ok(())
}

pub fn spawn_periodic(
    http: reqwest::Client,
    cfg: DiscoveryConfig,
    token: Arc<Mutex<String>>,
    interval_secs: u64,
) {
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(Duration::from_secs(interval_secs));
        ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            let token_now = token.lock().await.clone();
            if token_now.is_empty() {
                continue;
            }
            if let Err(e) = send_heartbeat(
                &http,
                &cfg,
                &token_now,
                None,
                None,
                None,
                "unknown",
                vec![],
            )
            .await
            {
                tracing::warn!(error = %e, "discovery heartbeat failed");
            }
        }
    });
}
