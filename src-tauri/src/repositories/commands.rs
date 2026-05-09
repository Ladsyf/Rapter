use sqlx::{Pool, Row, Sqlite};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::database::get_db_url;
use crate::repositories::models::{
    CreateFolderInput, CreateRepositoryInput, ExplorerContents, Folder, Repository, Script,
    UpdateFolderInput, UpdateRepositoryInput,
};

fn to_error<E: std::fmt::Display>(error: E) -> String {
    format!("Database error: {}", error)
}

async fn get_pool(db_instances: &State<'_, DbInstances>) -> Result<Pool<Sqlite>, String> {
    let map = db_instances.0.read().await;
    let pool = map
        .get(&get_db_url())
        .ok_or_else(|| format!("Database '{}' is not loaded", get_db_url()))?;

    let DbPool::Sqlite(sqlite_pool) = pool;
    Ok(sqlite_pool.clone())
}

async fn load_scripts(pool: &Pool<Sqlite>, repository_id: u64) -> Result<Vec<Script>, String> {
    let rows = sqlx::query(
        "SELECT id, repository_id, name, description, command, category
         FROM scripts
         WHERE repository_id = ?
         ORDER BY id ASC",
    )
    .bind(repository_id as i64)
    .fetch_all(pool)
    .await
    .map_err(to_error)?;

    Ok(rows
        .into_iter()
        .map(|row| Script {
            id: row.get::<i64, _>("id") as u64,
            repository_id: row.get::<i64, _>("repository_id") as u64,
            name: row.get::<String, _>("name"),
            description: row.get::<String, _>("description"),
            command: row.get::<String, _>("command"),
            category: row.get::<String, _>("category"),
        })
        .collect())
}

fn read_date_or_now(row: &sqlx::sqlite::SqliteRow, column: &str) -> String {
    row.get::<Option<String>, _>(column)
        .unwrap_or_else(|| "".to_string())
}

async fn load_folder_by_id_internal(pool: &Pool<Sqlite>, id: u64) -> Result<Option<Folder>, String> {
    let row = sqlx::query(
        "SELECT id, name, description, parent_id, date_created
         FROM folders
         WHERE id = ?",
    )
    .bind(id as i64)
    .fetch_optional(pool)
    .await
    .map_err(to_error)?;

    Ok(row.map(|folder_row| Folder {
        id: folder_row.get::<i64, _>("id") as u64,
        name: folder_row.get::<String, _>("name"),
        description: folder_row.get::<String, _>("description"),
        parent_id: folder_row
            .get::<Option<i64>, _>("parent_id")
            .map(|value| value as u64),
        date_created: read_date_or_now(&folder_row, "date_created"),
    }))
}

async fn ensure_folder_exists(pool: &Pool<Sqlite>, folder_id: u64) -> Result<(), String> {
    if load_folder_by_id_internal(pool, folder_id).await?.is_none() {
        return Err(format!("Folder with id {} was not found", folder_id));
    }

    Ok(())
}

async fn is_in_folder_subtree(
    pool: &Pool<Sqlite>,
    target_parent_id: Option<u64>,
    folder_id: u64,
) -> Result<bool, String> {
    let Some(mut current_id) = target_parent_id else {
        return Ok(false);
    };

    loop {
        if current_id == folder_id {
            return Ok(true);
        }

        let parent = load_folder_by_id_internal(pool, current_id).await?;
        let Some(folder) = parent else {
            return Ok(false);
        };

        let Some(next_id) = folder.parent_id else {
            return Ok(false);
        };

        current_id = next_id;
    }
}

async fn list_folders_by_parent(pool: &Pool<Sqlite>, parent_id: Option<u64>) -> Result<Vec<Folder>, String> {
    let rows = if let Some(parent_id) = parent_id {
        sqlx::query(
            "SELECT id, name, description, parent_id, date_created
             FROM folders
             WHERE parent_id = ?
             ORDER BY name COLLATE NOCASE ASC",
        )
        .bind(parent_id as i64)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query(
            "SELECT id, name, description, parent_id, date_created
             FROM folders
             WHERE parent_id IS NULL
             ORDER BY name COLLATE NOCASE ASC",
        )
        .fetch_all(pool)
        .await
    }
    .map_err(to_error)?;

    Ok(rows
        .into_iter()
        .map(|row| Folder {
            id: row.get::<i64, _>("id") as u64,
            name: row.get::<String, _>("name"),
            description: row.get::<String, _>("description"),
            parent_id: row
                .get::<Option<i64>, _>("parent_id")
                .map(|value| value as u64),
            date_created: read_date_or_now(&row, "date_created"),
        })
        .collect())
}

async fn list_repositories_by_parent(
    pool: &Pool<Sqlite>,
    parent_folder_id: Option<u64>,
) -> Result<Vec<Repository>, String> {
    let rows = if let Some(parent_folder_id) = parent_folder_id {
        sqlx::query(
            "SELECT id, name, description, path, date_created, parent_folder_id
             FROM repositories
             WHERE parent_folder_id = ?
             ORDER BY name COLLATE NOCASE ASC",
        )
        .bind(parent_folder_id as i64)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query(
            "SELECT id, name, description, path, date_created, parent_folder_id
             FROM repositories
             WHERE parent_folder_id IS NULL
             ORDER BY name COLLATE NOCASE ASC",
        )
        .fetch_all(pool)
        .await
    }
    .map_err(to_error)?;

    let mut repositories = Vec::with_capacity(rows.len());
    for row in rows {
        let repository_id = row.get::<i64, _>("id") as u64;
        repositories.push(Repository {
            id: repository_id,
            name: row.get::<String, _>("name"),
            description: row.get::<String, _>("description"),
            path: row.get::<String, _>("path"),
            scripts: load_scripts(pool, repository_id).await?,
            date_created: read_date_or_now(&row, "date_created"),
            parent_folder_id: row
                .get::<Option<i64>, _>("parent_folder_id")
                .map(|value| value as u64),
        });
    }

    Ok(repositories)
}

async fn get_repository_by_id_internal(
    pool: &Pool<Sqlite>,
    id: u64,
) -> Result<Option<Repository>, String> {
    let row = sqlx::query(
        "SELECT id, name, description, path, date_created
         , parent_folder_id
         FROM repositories
         WHERE id = ?",
    )
    .bind(id as i64)
    .fetch_optional(pool)
    .await
    .map_err(to_error)?;

    if let Some(repository_row) = row {
        let repository_id = repository_row.get::<i64, _>("id") as u64;
        let scripts = load_scripts(pool, repository_id).await?;

        return Ok(Some(Repository {
            id: repository_id,
            name: repository_row.get::<String, _>("name"),
            description: repository_row.get::<String, _>("description"),
            path: repository_row.get::<String, _>("path"),
            scripts,
            date_created: read_date_or_now(&repository_row, "date_created"),
            parent_folder_id: repository_row
                .get::<Option<i64>, _>("parent_folder_id")
                .map(|value| value as u64),
        }));
    }

    Ok(None)
}

#[tauri::command]
pub async fn get_repositories(db_instances: State<'_, DbInstances>) -> Result<Vec<Repository>, String> {
    let pool = get_pool(&db_instances).await?;
    let rows = sqlx::query(
        "SELECT id, name, description, path, date_created, parent_folder_id
         FROM repositories
         ORDER BY id DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(to_error)?;

    let mut repositories = Vec::with_capacity(rows.len());
    for row in rows {
        let repository_id = row.get::<i64, _>("id") as u64;
        repositories.push(Repository {
            id: repository_id,
            name: row.get::<String, _>("name"),
            description: row.get::<String, _>("description"),
            path: row.get::<String, _>("path"),
            scripts: load_scripts(&pool, repository_id).await?,
            date_created: read_date_or_now(&row, "date_created"),
            parent_folder_id: row
                .get::<Option<i64>, _>("parent_folder_id")
                .map(|value| value as u64),
        });
    }

    Ok(repositories)
}

#[tauri::command]
pub async fn get_root_contents(db_instances: State<'_, DbInstances>) -> Result<ExplorerContents, String> {
    let pool = get_pool(&db_instances).await?;

    Ok(ExplorerContents {
        folder_id: None,
        folders: list_folders_by_parent(&pool, None).await?,
        repositories: list_repositories_by_parent(&pool, None).await?,
    })
}

#[tauri::command]
pub async fn get_folder_contents(
    folder_id: u64,
    db_instances: State<'_, DbInstances>,
) -> Result<ExplorerContents, String> {
    let pool = get_pool(&db_instances).await?;

    if load_folder_by_id_internal(&pool, folder_id).await?.is_none() {
        return Err(format!("Folder with id {} was not found", folder_id));
    }

    Ok(ExplorerContents {
        folder_id: Some(folder_id),
        folders: list_folders_by_parent(&pool, Some(folder_id)).await?,
        repositories: list_repositories_by_parent(&pool, Some(folder_id)).await?,
    })
}

#[tauri::command]
pub async fn get_folder_by_id(
    id: u64,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<Folder>, String> {
    let pool = get_pool(&db_instances).await?;
    load_folder_by_id_internal(&pool, id).await
}

#[tauri::command]
pub async fn get_folder_ancestors(
    folder_id: u64,
    db_instances: State<'_, DbInstances>,
) -> Result<Vec<Folder>, String> {
    let pool = get_pool(&db_instances).await?;
    let mut current_folder = load_folder_by_id_internal(&pool, folder_id).await?;
    let mut ancestors = Vec::new();

    while let Some(folder) = current_folder {
        let parent_id = folder.parent_id;
        ancestors.push(folder);

        current_folder = if let Some(parent_id) = parent_id {
            load_folder_by_id_internal(&pool, parent_id).await?
        } else {
            None
        };
    }

    ancestors.reverse();
    Ok(ancestors)
}

#[tauri::command]
pub async fn create_folder(
    payload: CreateFolderInput,
    db_instances: State<'_, DbInstances>,
) -> Result<Folder, String> {
    let pool = get_pool(&db_instances).await?;
    let mut tx = pool.begin().await.map_err(to_error)?;

    if let Some(parent_id) = payload.parent_id {
        let parent_exists = sqlx::query("SELECT 1 FROM folders WHERE id = ?")
            .bind(parent_id as i64)
            .fetch_optional(&mut *tx)
            .await
            .map_err(to_error)?
            .is_some();

        if !parent_exists {
            return Err(format!("Parent folder with id {} was not found", parent_id));
        }
    }

    let insert_result = sqlx::query(
        "INSERT INTO folders (name, description, parent_id, date_created)
         VALUES (?, ?, ?, datetime('now'))",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(payload.parent_id.map(|value| value as i64))
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    let folder_id = insert_result.last_insert_rowid() as u64;
    tx.commit().await.map_err(to_error)?;

    load_folder_by_id_internal(&pool, folder_id)
        .await?
        .ok_or_else(|| "Folder was created but could not be reloaded".to_string())
}

#[tauri::command]
pub async fn update_folder(
    id: u64,
    payload: UpdateFolderInput,
    db_instances: State<'_, DbInstances>,
) -> Result<Folder, String> {
    let pool = get_pool(&db_instances).await?;
    let mut tx = pool.begin().await.map_err(to_error)?;

    let update_result = sqlx::query(
        "UPDATE folders
         SET name = ?, description = ?
         WHERE id = ?",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(id as i64)
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    if update_result.rows_affected() == 0 {
        return Err(format!("Folder with id {} was not found", id));
    }

    tx.commit().await.map_err(to_error)?;

    load_folder_by_id_internal(&pool, id)
        .await?
        .ok_or_else(|| format!("Folder with id {} was not found", id))
}

#[tauri::command]
pub async fn delete_folder(id: u64, db_instances: State<'_, DbInstances>) -> Result<u64, String> {
    let pool = get_pool(&db_instances).await?;
    let delete_result = sqlx::query("DELETE FROM folders WHERE id = ?")
        .bind(id as i64)
        .execute(&pool)
        .await
        .map_err(to_error)?;

    if delete_result.rows_affected() == 0 {
        return Err(format!("Folder with id {} was not found", id));
    }

    Ok(id)
}

#[tauri::command]
pub async fn move_folder(
    folder_id: u64,
    target_parent_id: Option<u64>,
    db_instances: State<'_, DbInstances>,
) -> Result<Folder, String> {
    let pool = get_pool(&db_instances).await?;
    ensure_folder_exists(&pool, folder_id).await?;

    if let Some(target_parent_id) = target_parent_id {
        ensure_folder_exists(&pool, target_parent_id).await?;
    }

    if target_parent_id == Some(folder_id) {
        return Err("A folder cannot be moved into itself".to_string());
    }

    if is_in_folder_subtree(&pool, target_parent_id, folder_id).await? {
        return Err("A folder cannot be moved into one of its descendants".to_string());
    }

    sqlx::query(
        "UPDATE folders
         SET parent_id = ?
         WHERE id = ?",
    )
    .bind(target_parent_id.map(|value| value as i64))
    .bind(folder_id as i64)
    .execute(&pool)
    .await
    .map_err(to_error)?;

    load_folder_by_id_internal(&pool, folder_id)
        .await?
        .ok_or_else(|| format!("Folder with id {} was not found", folder_id))
}

#[tauri::command]
pub async fn move_repository(
    repository_id: u64,
    target_parent_id: Option<u64>,
    db_instances: State<'_, DbInstances>,
) -> Result<Repository, String> {
    let pool = get_pool(&db_instances).await?;

    if let Some(target_parent_id) = target_parent_id {
        ensure_folder_exists(&pool, target_parent_id).await?;
    }

    let update_result = sqlx::query(
        "UPDATE repositories
         SET parent_folder_id = ?
         WHERE id = ?",
    )
    .bind(target_parent_id.map(|value| value as i64))
    .bind(repository_id as i64)
    .execute(&pool)
    .await
    .map_err(to_error)?;

    if update_result.rows_affected() == 0 {
        return Err(format!("Repository with id {} was not found", repository_id));
    }

    get_repository_by_id_internal(&pool, repository_id)
        .await?
        .ok_or_else(|| format!("Repository with id {} was not found", repository_id))
}

#[tauri::command]
pub async fn get_repository_by_id(
    id: u64,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<Repository>, String> {
    let pool = get_pool(&db_instances).await?;
    get_repository_by_id_internal(&pool, id).await
}

#[tauri::command]
pub async fn create_repository(
    payload: CreateRepositoryInput,
    db_instances: State<'_, DbInstances>,
) -> Result<Repository, String> {
    let pool = get_pool(&db_instances).await?;
    let mut tx = pool.begin().await.map_err(to_error)?;

    let repo_insert = sqlx::query(
           "INSERT INTO repositories (name, description, path, date_created, parent_folder_id)
            VALUES (?, ?, ?, datetime('now'), ?)",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.path)
        .bind(payload.parent_folder_id.map(|value| value as i64))
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    let repository_id = repo_insert.last_insert_rowid() as u64;

    tx.commit().await.map_err(to_error)?;

    get_repository_by_id_internal(&pool, repository_id)
        .await?
        .ok_or_else(|| "Repository was created but could not be reloaded".to_string())
}

#[tauri::command]
pub async fn update_repository(
    id: u64,
    payload: UpdateRepositoryInput,
    db_instances: State<'_, DbInstances>,
) -> Result<Repository, String> {
    let pool = get_pool(&db_instances).await?;
    let mut tx = pool.begin().await.map_err(to_error)?;

    let update_result = sqlx::query(
        "UPDATE repositories
            SET name = ?, description = ?, path = ?, parent_folder_id = ?
         WHERE id = ?",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.path)
        .bind(payload.parent_folder_id.map(|value| value as i64))
    .bind(id as i64)
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    if update_result.rows_affected() == 0 {
        return Err(format!("Repository with id {} was not found", id));
    }

    tx.commit().await.map_err(to_error)?;

    get_repository_by_id_internal(&pool, id)
        .await?
        .ok_or_else(|| format!("Repository with id {} was not found", id))
}

#[tauri::command]
pub async fn delete_repository(
    id: u64,
    db_instances: State<'_, DbInstances>,
) -> Result<u64, String> {
    let pool = get_pool(&db_instances).await?;
    let mut tx = pool.begin().await.map_err(to_error)?;

    sqlx::query("DELETE FROM scripts WHERE repository_id = ?")
        .bind(id as i64)
        .execute(&mut *tx)
        .await
        .map_err(to_error)?;

    let delete_result = sqlx::query("DELETE FROM repositories WHERE id = ?")
        .bind(id as i64)
        .execute(&mut *tx)
        .await
        .map_err(to_error)?;

    if delete_result.rows_affected() == 0 {
        return Err(format!("Repository with id {} was not found", id));
    }

    tx.commit().await.map_err(to_error)?;
    Ok(id)
}
