use std::time::Instant;
use tracing::warn;

pub struct LatencyGuard {
    start: Instant,
    command: String,
}

impl LatencyGuard {
    pub fn start(command: impl Into<String>) -> Self {
        Self { start: Instant::now(), command: command.into() }
    }
    pub fn finish(self) {
        let dur = self.start.elapsed();
        if dur.as_millis() > 100 {
            warn!(target: "perf", "command {} took {}ms", self.command, dur.as_millis());
        }
        tracing::trace!(target: "perf", "command {} in {}ms", self.command, dur.as_millis());
    }
}
