mod repositories;
mod migrations;
mod database;

use database::DB_URL;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(DB_URL, migrations::all())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            repositories::commands::get_repositories,
            repositories::commands::get_repository_by_id,
            repositories::commands::create_repository,
            repositories::commands::update_repository,
            repositories::commands::delete_repository
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
