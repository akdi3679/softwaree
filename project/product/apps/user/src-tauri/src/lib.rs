pub mod state;
pub mod error;
pub mod auth;
pub mod search;
pub mod commands;
pub mod crypto;
pub mod sync;
pub mod db;
pub mod projection;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let paths = state::AppPaths::new(&app.handle().path())?;
            let state = state::AppState::new(paths)?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping::ping,
            commands::auth::login_user,
            commands::auth::logout_user,
            commands::sync::connect_to_admin,
            commands::sync::disconnect_from_admin,
            commands::sync::sync_now,
            commands::data::list_projection,
            commands::data::query_event_log,
            commands::data::query_domain,
            commands::annotate::add_annotation,
            commands::attachments::get_attachment,
            commands::export::export_projection_pdf,
            commands::handover::accept_handover,
            commands::handover::generate_handover_token,
            commands::search::search,
            commands::search::global_search,
            commands::totp::generate_totp_setup,
            commands::totp::verify_totp_code,
            commands::totp::totp_url_for_secret,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
