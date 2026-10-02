use tauri::Manager;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use crate::error::AppResult;

pub fn init_logging<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> AppResult<()> {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,admin=debug"));

    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| crate::error::AppError::PathResolution(e.to_string()))?;
    std::fs::create_dir_all(&log_dir)?;

    let file_appender = tracing_appender::rolling::daily(&log_dir, "admin.log");
    let (file_writer, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(filter)
        .with(
            fmt::layer()
                .with_writer(file_writer)
                .with_ansi(false)
                .json(),
        )
        .with(
            fmt::layer()
                .with_writer(std::io::stdout)
                .with_ansi(true)
                .compact(),
        )
        .init();

    Ok(())
}
