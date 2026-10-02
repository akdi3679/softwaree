//! Mesh health: track per-peer liveness.
//!
//! A peer is "healthy" if we have seen an mDNS presence or a successful
//! TCP ping within `timeout`. Health is exposed to the UI so the Admin can
//! see which Users are currently reachable.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::time::{Duration, Instant};

use tokio::net::TcpStream;
use tokio::time::timeout;

use crate::error::AppResult;

#[derive(Debug, Clone)]
pub struct PeerHealth {
    pub user_id: String,
    pub device_id: String,
    pub last_seen: Instant,
    pub last_state: PeerState,
    pub last_latency_ms: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub enum PeerState {
    Online,
    Unreachable,
    Unknown,
}

#[derive(Default)]
pub struct MeshHealth {
    peers: HashMap<String, PeerHealth>,
}

impl MeshHealth {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn note_seen(&mut self, user_id: &str, device_id: &str) {
        self.peers
            .entry(user_id.to_string())
            .and_modify(|p| {
                p.last_seen = Instant::now();
                p.last_state = PeerState::Online;
            })
            .or_insert_with(|| PeerHealth {
                user_id: user_id.to_string(),
                device_id: device_id.to_string(),
                last_seen: Instant::now(),
                last_state: PeerState::Online,
                last_latency_ms: None,
            });
    }

    pub fn snapshot(&self) -> Vec<PeerHealth> {
        self.peers.values().cloned().collect()
    }

    pub fn mark_stale(&mut self, max_age: Duration) {
        let now = Instant::now();
        for p in self.peers.values_mut() {
            if now.duration_since(p.last_seen) > max_age {
                p.last_state = PeerState::Unreachable;
            }
        }
    }
}

/// TCP ping a peer's sync port. Returns round-trip latency in milliseconds.
pub async fn ping_peer(addr: SocketAddr, timeout_ms: u64) -> AppResult<u64> {
    let start = Instant::now();
    let _stream = timeout(Duration::from_millis(timeout_ms), TcpStream::connect(addr))
        .await
        .map_err(|_| crate::error::AppError::Network(format!("ping timeout: {addr}")))?
        .map_err(|e| crate::error::AppError::Network(format!("ping connect: {e}")))?;
    Ok(start.elapsed().as_millis() as u64)
}
