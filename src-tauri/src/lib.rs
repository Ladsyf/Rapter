mod repositories;
mod scripts;
mod migrations;
mod database;

use database::get_db_url;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(scripts::ScriptProcesses::default())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(&get_db_url(), migrations::all())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            repositories::commands::get_repositories,
            repositories::commands::get_repository_by_id,
            repositories::commands::create_repository,
            repositories::commands::update_repository,
            repositories::commands::delete_repository,
            repositories::commands::get_root_contents,
            repositories::commands::get_folder_contents,
            repositories::commands::get_folder_by_id,
            repositories::commands::get_folder_ancestors,
            repositories::commands::create_folder,
            repositories::commands::update_folder,
            repositories::commands::delete_folder,
            repositories::commands::move_folder,
            repositories::commands::move_repository,
            scripts::commands::get_scripts,
            scripts::commands::get_script_by_id,
            scripts::commands::create_script,
            scripts::commands::update_script,
            scripts::commands::delete_script,
            scripts::commands::is_script_running,
            scripts::commands::get_script_output,
            scripts::commands::run_script,
            scripts::commands::stop_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
