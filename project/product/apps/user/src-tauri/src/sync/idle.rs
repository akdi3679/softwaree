use std::sync::Arc;
use std::time::Duration;

use tokio::sync::Mutex;
use tokio::time::Instant;

pub struct IdleWatcher {
    last_activity: Arc<Mutex<Instant>>,
    timeout: Duration,
}

impl IdleWatcher {
    pub fn new(timeout_secs: u64) -> Self {
        Self {
            last_activity: Arc::new(Mutex::new(Instant::now())),
            timeout: Duration::from_secs(timeout_secs),
        }
    }

    pub async fn touch(&self) {
        *self.last_activity.lock().await = Instant::now();
    }

    pub async fn is_idle(&self) -> bool {
        self.last_activity.lock().await.elapsed() > self.timeout
    }
}
