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
        Migration {
            version: 3,
            description: "add_date_created_to_repositories",
            sql: "
                ALTER TABLE repositories
                ADD COLUMN date_created TEXT;

                UPDATE repositories
                SET date_created = datetime('now')
                WHERE date_created IS NULL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_folders_table",
            sql: "
                CREATE TABLE IF NOT EXISTS folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    parent_id INTEGER,
                    date_created TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE,
                    UNIQUE(name, parent_id)
                );

                CREATE INDEX IF NOT EXISTS idx_folders_parent_id
                ON folders(parent_id);
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_parent_folder_to_repositories",
            sql: "
                ALTER TABLE repositories
                ADD COLUMN parent_folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE;

                CREATE INDEX IF NOT EXISTS idx_repositories_parent_folder_id
                ON repositories(parent_folder_id);

                UPDATE repositories
                SET date_created = datetime('now')
                WHERE date_created IS NULL;
            ",
            kind: MigrationKind::Up,
        },
    ]
}