use tokio::sync::mpsc;

pub const DEFAULT_MAX_BUFFERED_FRAMES: usize = 1024;
pub const DEFAULT_MAX_IN_FLIGHT: usize = 64;

/// Per-connection outbound queue. A slow consumer fills the bounded channel;
/// `send` then awaits instead of buffering without limit. This is what stops
/// one stuck User from ballooning the Admin's memory.
pub struct Backpressure {
    buffered: mpsc::Sender<Vec<u8>>,
}

impl Backpressure {
    pub fn new(_max_in_flight: usize) -> (Self, mpsc::Receiver<Vec<u8>>) {
        let (tx, rx) = mpsc::channel(DEFAULT_MAX_BUFFERED_FRAMES);
        (Self { buffered: tx }, rx)
    }

    pub async fn send(&self, frame: Vec<u8>) -> Result<(), BackpressureError> {
        self.buffered
            .send(frame)
            .await
            .map_err(|_| BackpressureError::ReceiverClosed)
    }
}

#[derive(Debug)]
pub enum BackpressureError {
    ReceiverClosed,
}
