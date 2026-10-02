pub mod diagnostics;
pub mod notifications;
pub mod billing;
pub mod observability;
use tauri::Manager;

mod commands;
mod error;
mod state;
mod paths;
mod log_init;
mod crypto;
mod identity;
mod db;
mod domain;
mod audit;
mod events;
mod auth;
mod authz;
pub mod sync;
mod startup_smoke;
mod modules;
mod backup;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            log_init::init_logging(app.handle())?;
            let paths = paths::AppPaths::resolve(app.handle())?;
            let state = AppState::new(paths)?;
            tauri::async_runtime::block_on(async {
                db::system_db::init(&state).await
            })?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // --- core ---
            commands::ping::ping,
            // --- projects + users ---
            commands::project::list_local_projects,
            commands::project::open_project,
            commands::project::create_project,
            commands::project::invite_user,
            commands::project::create_user,
            commands::project::change_user_role,
            commands::project::remove_user,
            commands::project::list_users,
            commands::project::list_roles,
            // --- auth + cloud ---
            commands::auth::login_admin,
            commands::auth::logout_admin,
            commands::cloud::cloud_login,
            // --- search + import ---
            commands::event_search::search_events,
            commands::csv_import::import_patients_csv,
            // --- backups ---
            commands::backup::trigger_backup,
            commands::backup::restore_backup,
            commands::backup::verify_backup,
            // --- modules ---
            commands::modules_cmd::list_installed_modules,
            commands::modules_cmd::list_available_modules,
            commands::modules_cmd::install_module,
            commands::module_query::module_query,
            commands::module_query::search_patients,
            commands::module_cmd::module_command,
            commands::pdf::generate_lab_report,
            commands::pdf::generate_prescription,
            commands::totp::generate_totp_setup,
            commands::totp::verify_totp_code,
            commands::totp::totp_url_for_secret,
            // --- billing ---
            commands::billing::current_plan,
            commands::billing::check_user_quota,
            commands::billing::check_project_quota,
            // --- analytics ---
            commands::analytics::project_analytics,
            commands::analytics::medical_kpis,
            commands::analytics::foodlab_kpis,
            // --- ops ---
            commands::batch::execute_batch,
            commands::data_quality::data_quality_check,
            commands::device_replace::begin_device_replacement,
            commands::device_replace::submit_device_replacement,
            commands::diag::export_diagnostic_tarball,
            commands::maintenance::vacuum_database,
            commands::cron::schedule,
            commands::update_check::check_for_update,
            commands::api_client::api_request,
            // --- compliance ---
            commands::gdpr::gdpr_forget_user,
            commands::gdpr_export::gdpr_export,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


















