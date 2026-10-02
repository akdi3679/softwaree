use prometheus::{Counter, Encoder, Gauge, Histogram, HistogramOpts, Opts, Registry, TextEncoder};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

pub struct Metrics {
    pub registry: Registry,
    pub commands_total: Counter,
    pub events_appended_total: Counter,
    pub sync_clients_active: Gauge,
    pub module_load_duration: Histogram,
    pub http_request_duration: Histogram,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();

        let commands_total = Counter::with_opts(
            Opts::new("admin_commands_total", "Total commands processed"),
        ).expect("commands_total");

        let events_appended_total = Counter::with_opts(
            Opts::new("admin_events_appended_total", "Total events appended"),
        ).expect("events_appended_total");

        let sync_clients_active = Gauge::with_opts(
            Opts::new("admin_sync_clients_active", "Active sync clients"),
        ).expect("sync_clients_active");

        let module_load_duration = Histogram::with_opts(
            HistogramOpts::new("admin_module_load_seconds", "Module load time")
                .buckets(vec![0.001, 0.01, 0.1, 1.0, 10.0]),
        ).expect("module_load_duration");

        let http_request_duration = Histogram::with_opts(
            HistogramOpts::new("admin_http_request_seconds", "HTTP request duration")
                .buckets(vec![0.001, 0.01, 0.1, 1.0, 10.0]),
        ).expect("http_request_duration");

        registry.register(Box::new(commands_total.clone())).ok();
        registry.register(Box::new(events_appended_total.clone())).ok();
        registry.register(Box::new(sync_clients_active.clone())).ok();
        registry.register(Box::new(module_load_duration.clone())).ok();
        registry.register(Box::new(http_request_duration.clone())).ok();

        Self {
            registry,
            commands_total,
            events_appended_total,
            sync_clients_active,
            module_load_duration,
            http_request_duration,
        }
    }
}

impl Default for Metrics {
    fn default() -> Self {
        Self::new()
    }
}

pub async fn serve(metrics: Arc<Metrics>, addr: SocketAddr) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    tracing::info!(%addr, "metrics server listening");
    loop {
        let (mut socket, _peer) = listener.accept().await?;
        let metrics = metrics.clone();
        tokio::spawn(async move {
            // Drain the request headers; we ignore them.
            let mut buf = [0u8; 1024];
            let _ = tokio::time::timeout(
                std::time::Duration::from_millis(500),
                socket.read(&mut buf),
            ).await;

            let mut body = Vec::new();
            let encoder = TextEncoder::new();
            let families = metrics.registry.gather();
            let _ = encoder.encode(&families, &mut body);

            let response = format!(
                "HTTP/1.1 200 OK\r\ncontent-type: text/plain; version=0.0.4\r\ncontent-length: {}\r\nconnection: close\r\n\r\n",
                body.len()
            );
            let _ = socket.write_all(response.as_bytes()).await;
            let _ = socket.write_all(&body).await;
            let _ = socket.shutdown().await;
        });
    }
}
