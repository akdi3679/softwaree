use std::sync::Arc;
use std::time::Duration;

use rand::Rng;
use tokio::sync::{OwnedSemaphorePermit, Semaphore};
use tokio::time::sleep;

/// Throttles concurrent connections on the Admin's sync server so all
/// Users reconnecting at once (Monday morning, admin just came back online)
/// do not overwhelm it.
pub struct ReconnectThrottle {
    semaphore: Arc<Semaphore>,
    pub per_user_backoff: Duration,
    pub jitter_max_ms: u64,
}

impl ReconnectThrottle {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            per_user_backoff: Duration::from_secs(2),
            jitter_max_ms: 5000,
        }
    }

    pub async fn acquire(&self, user_id: &str) -> OwnedSemaphorePermit {
        let jitter_ms = rand::thread_rng().gen_range(0..self.jitter_max_ms);
        sleep(Duration::from_millis(jitter_ms)).await;

        let user_delay = (hash(user_id) % 1000) as u64;
        sleep(Duration::from_millis(user_delay)).await;

        self.semaphore
            .clone()
            .acquire_owned()
            .await
            .expect("semaphore closed")
    }
}

fn hash(s: &str) -> u32 {
    let mut h: u32 = 0;
    for c in s.chars() {
        h = h.wrapping_mul(31).wrapping_add(c as u32);
    }
    h
}
