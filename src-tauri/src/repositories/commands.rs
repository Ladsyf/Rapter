use sqlx::{Pool, Row, Sqlite};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::database::DB_URL;
use crate::repositories::models::{CreateRepositoryInput, Repository, Script, UpdateRepositoryInput};

fn to_error<E: std::fmt::Display>(error: E) -> String {
    format!("Database error: {}", error)
}

async fn get_pool(db_instances: &State<'_, DbInstances>) -> Result<Pool<Sqlite>, String> {
    let map = db_instances.0.read().await;
    let pool = map
        .get(DB_URL)
        .ok_or_else(|| format!("Database '{}' is not loaded", DB_URL))?;

    let DbPool::Sqlite(sqlite_pool) = pool;
    Ok(sqlite_pool.clone())
}

async fn load_scripts(pool: &Pool<Sqlite>, repository_id: u64) -> Result<Vec<Script>, String> {
    let rows = sqlx::query(
        "SELECT id, name, description, command, category
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
            name: row.get::<String, _>("name"),
            description: row.get::<String, _>("description"),
            command: row.get::<String, _>("command"),
            category: row.get::<String, _>("category"),
        })
        .collect())
}

async fn get_repository_by_id_internal(
    pool: &Pool<Sqlite>,
    id: u64,
) -> Result<Option<Repository>, String> {
    let row = sqlx::query(
        "SELECT id, name, description, path
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
        }));
    }

    Ok(None)
}

#[tauri::command]
pub async fn get_repositories(db_instances: State<'_, DbInstances>) -> Result<Vec<Repository>, String> {
    let pool = get_pool(&db_instances).await?;
    let rows = sqlx::query(
        "SELECT id, name, description, path
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
        });
    }

    Ok(repositories)
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
        "INSERT INTO repositories (name, description, path)
         VALUES (?, ?, ?)",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.path)
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    let repository_id = repo_insert.last_insert_rowid() as u64;

    for script in payload.scripts {
        sqlx::query(
            "INSERT INTO scripts (repository_id, name, description, command, category)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(repository_id as i64)
        .bind(&script.name)
        .bind(&script.description)
        .bind(&script.command)
        .bind(&script.category)
        .execute(&mut *tx)
        .await
        .map_err(to_error)?;
    }

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
         SET name = ?, description = ?, path = ?
         WHERE id = ?",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.path)
    .bind(id as i64)
    .execute(&mut *tx)
    .await
    .map_err(to_error)?;

    if update_result.rows_affected() == 0 {
        return Err(format!("Repository with id {} was not found", id));
    }

    sqlx::query("DELETE FROM scripts WHERE repository_id = ?")
        .bind(id as i64)
        .execute(&mut *tx)
        .await
        .map_err(to_error)?;

    for script in payload.scripts {
        sqlx::query(
            "INSERT INTO scripts (repository_id, name, description, command, category)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(id as i64)
        .bind(&script.name)
        .bind(&script.description)
        .bind(&script.command)
        .bind(&script.category)
        .execute(&mut *tx)
        .await
        .map_err(to_error)?;
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
