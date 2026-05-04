use tauri_plugin_sql::{Migration, MigrationKind};

pub fn all() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_repositories_table",
            sql: "
                CREATE TABLE IF NOT EXISTS repositories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    path TEXT NOT NULL UNIQUE
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_scripts_table",
            sql: "
                CREATE TABLE IF NOT EXISTS scripts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    repository_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    command TEXT NOT NULL,
                    category TEXT NOT NULL,
                    FOREIGN KEY(repository_id) REFERENCES repositories(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_scripts_repository_id
                ON scripts(repository_id);
            ",
            kind: MigrationKind::Up,
        },
    ]
}