use std::io::{BufRead, BufReader, Read};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;

use serde::Deserialize;
use sqlx::{Pool, Row, Sqlite};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::database::get_db_url;
use crate::repositories::models::Script;
use crate::scripts::ScriptProcesses;

const MAX_OUTPUT_LENGTH: usize = 64_000;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateScriptInput {
	pub repository_id: u64,
	pub name: String,
	pub description: String,
	pub command: String,
	pub category: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateScriptInput {
	pub repository_id: u64,
	pub name: String,
	pub description: String,
	pub command: String,
	pub category: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunScriptInput {
	pub id: u64,
	pub repository_path: String,
}

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

fn map_script(row: sqlx::sqlite::SqliteRow) -> Script {
	Script {
		id: row.get::<i64, _>("id") as u64,
		repository_id: row.get::<i64, _>("repository_id") as u64,
		name: row.get::<String, _>("name"),
		description: row.get::<String, _>("description"),
		command: row.get::<String, _>("command"),
		category: row.get::<String, _>("category"),
	}
}

fn is_running_internal(processes: &ScriptProcesses, script_id: u64) -> Result<bool, String> {
	let mut children = processes
		.children
		.lock()
		.map_err(|_| "Script process state is unavailable".to_string())?;

	let Some(child) = children.get_mut(&script_id) else {
		return Ok(false);
	};

	match child.try_wait().map_err(to_error)? {
		Some(_) => {
			children.remove(&script_id);
			Ok(false)
		}
		None => Ok(true),
	}
}

fn append_output(
	outputs: &Arc<Mutex<std::collections::HashMap<u64, String>>>,
	script_id: u64,
	chunk: &str,
) {
	if let Ok(mut output_map) = outputs.lock() {
		let output = output_map.entry(script_id).or_default();
		output.push_str(chunk);

		if output.len() > MAX_OUTPUT_LENGTH {
			let trim_start = output.len() - MAX_OUTPUT_LENGTH;
			output.drain(..trim_start);
		}
	}
}

fn pipe_output<R>(
	reader: R,
	script_id: u64,
	outputs: Arc<Mutex<std::collections::HashMap<u64, String>>>,
) where
	R: Read + Send + 'static,
{
	thread::spawn(move || {
		let mut buffered_reader = BufReader::new(reader);
		let mut line = String::new();

		loop {
			line.clear();
			match buffered_reader.read_line(&mut line) {
				Ok(0) => break,
				Ok(_) => append_output(&outputs, script_id, &line),
				Err(error) => {
					append_output(
						&outputs,
						script_id,
						&format!("\n[stream error] {}\n", error),
					);
					break;
				}
			}
		}
	});
}

async fn load_script_command(
	pool: &Pool<Sqlite>,
	script_id: u64,
) -> Result<Option<String>, String> {
	let row = sqlx::query(
		"SELECT scripts.command
		 FROM scripts
		 WHERE scripts.id = ?",
	)
	.bind(script_id as i64)
	.fetch_optional(pool)
	.await
	.map_err(to_error)?;

	Ok(row.map(|row| row.get::<String, _>("command")))
}

fn spawn_script_process(command: &str, working_directory: &str) -> Result<Child, String> {
	#[cfg(target_os = "windows")]
	let mut process = {
		let mut command_builder = Command::new("cmd");
		command_builder.arg("/C").arg(command);
		command_builder
	};

	#[cfg(not(target_os = "windows"))]
	let mut process = {
		let mut command_builder = Command::new("sh");
		command_builder.arg("-c").arg(command);
		command_builder
	};

	process
		.current_dir(working_directory)
		.stdin(Stdio::null())
		.stdout(Stdio::piped())
		.stderr(Stdio::piped())
		.spawn()
		.map_err(to_error)
}

fn stop_child(child: &mut std::process::Child) -> Result<(), String> {
	#[cfg(target_os = "windows")]
	{
		let status = Command::new("taskkill")
			.args(["/PID", &child.id().to_string(), "/T", "/F"])
			.stdout(Stdio::null())
			.stderr(Stdio::null())
			.status()
			.map_err(to_error)?;

		if !status.success() {
			return Err(format!("Failed to stop process {}", child.id()));
		}
	}

	#[cfg(not(target_os = "windows"))]
	{
		child.kill().map_err(to_error)?;
	}

	let _ = child.wait();
	Ok(())
}

async fn get_script_by_id_internal(pool: &Pool<Sqlite>, id: u64) -> Result<Option<Script>, String> {
	let row = sqlx::query(
		"SELECT id, repository_id, name, description, command, category
		 FROM scripts
		 WHERE id = ?",
	)
	.bind(id as i64)
	.fetch_optional(pool)
	.await
	.map_err(to_error)?;

	Ok(row.map(map_script))
}

#[tauri::command]
pub async fn get_scripts(
	repository_id: u64,
	db_instances: State<'_, DbInstances>,
) -> Result<Vec<Script>, String> {
	let pool = get_pool(&db_instances).await?;
	let rows = sqlx::query(
		"SELECT id, repository_id, name, description, command, category
		 FROM scripts
		 WHERE repository_id = ?
		 ORDER BY id ASC",
	)
	.bind(repository_id as i64)
	.fetch_all(&pool)
	.await
	.map_err(to_error)?;

	Ok(rows.into_iter().map(map_script).collect())
}

#[tauri::command]
pub async fn get_script_by_id(
	id: u64,
	db_instances: State<'_, DbInstances>,
) -> Result<Option<Script>, String> {
	let pool = get_pool(&db_instances).await?;
	get_script_by_id_internal(&pool, id).await
}

#[tauri::command]
pub async fn create_script(
	payload: CreateScriptInput,
	db_instances: State<'_, DbInstances>,
) -> Result<Script, String> {
	let pool = get_pool(&db_instances).await?;
	let mut tx = pool.begin().await.map_err(to_error)?;

	let insert_result = sqlx::query(
		"INSERT INTO scripts (repository_id, name, description, command, category)
		 VALUES (?, ?, ?, ?, ?)",
	)
	.bind(payload.repository_id as i64)
	.bind(&payload.name)
	.bind(&payload.description)
	.bind(&payload.command)
	.bind(&payload.category)
	.execute(&mut *tx)
	.await
	.map_err(to_error)?;

	let script_id = insert_result.last_insert_rowid() as u64;
	tx.commit().await.map_err(to_error)?;

	get_script_by_id_internal(&pool, script_id)
		.await?
		.ok_or_else(|| "Script was created but could not be reloaded".to_string())
}

#[tauri::command]
pub async fn update_script(
	id: u64,
	payload: UpdateScriptInput,
	db_instances: State<'_, DbInstances>,
) -> Result<Script, String> {
	let pool = get_pool(&db_instances).await?;
	let mut tx = pool.begin().await.map_err(to_error)?;

	let update_result = sqlx::query(
		"UPDATE scripts
		    SET repository_id = ?, name = ?, description = ?, command = ?, category = ?
		 WHERE id = ?",
	)
	    .bind(payload.repository_id as i64)
	.bind(&payload.name)
	.bind(&payload.description)
	.bind(&payload.command)
	.bind(&payload.category)
	.bind(id as i64)
	.execute(&mut *tx)
	.await
	.map_err(to_error)?;

	if update_result.rows_affected() == 0 {
		return Err(format!("Script with id {} was not found", id));
	}

	tx.commit().await.map_err(to_error)?;

	get_script_by_id_internal(&pool, id)
		.await?
		.ok_or_else(|| format!("Script with id {} was not found", id))
}

#[tauri::command]
pub async fn delete_script(id: u64, db_instances: State<'_, DbInstances>) -> Result<u64, String> {
	let pool = get_pool(&db_instances).await?;
	let mut tx = pool.begin().await.map_err(to_error)?;

	let delete_result = sqlx::query("DELETE FROM scripts WHERE id = ?")
		.bind(id as i64)
		.execute(&mut *tx)
		.await
		.map_err(to_error)?;

	if delete_result.rows_affected() == 0 {
		return Err(format!("Script with id {} was not found", id));
	}

	tx.commit().await.map_err(to_error)?;
	Ok(id)
}

#[tauri::command]
pub async fn is_script_running(
	id: u64,
	processes: State<'_, ScriptProcesses>,
) -> Result<bool, String> {
	is_running_internal(&processes, id)
}

#[tauri::command]
pub async fn get_script_output(
	id: u64,
	processes: State<'_, ScriptProcesses>,
) -> Result<String, String> {
	let outputs = processes
		.outputs
		.lock()
		.map_err(|_| "Script output state is unavailable".to_string())?;

	Ok(outputs.get(&id).cloned().unwrap_or_default())
}

#[tauri::command]
pub async fn run_script(
	payload: RunScriptInput,
	db_instances: State<'_, DbInstances>,
	processes: State<'_, ScriptProcesses>,
) -> Result<bool, String> {
	let id = payload.id;

	if is_running_internal(&processes, id)? {
		return Ok(true);
	}

	let pool = get_pool(&db_instances).await?;
	let command = load_script_command(&pool, id)
		.await?
		.ok_or_else(|| format!("Script with id {} was not found", id))?;

	{
		let mut outputs = processes
			.outputs
			.lock()
			.map_err(|_| "Script output state is unavailable".to_string())?;
		outputs.insert(id, String::new());
	}

	let mut child = spawn_script_process(&command, &payload.repository_path)?;
	let outputs = Arc::clone(&processes.outputs);

	if let Some(stdout) = child.stdout.take() {
		pipe_output(stdout, id, Arc::clone(&outputs));
	}

	if let Some(stderr) = child.stderr.take() {
		pipe_output(stderr, id, Arc::clone(&outputs));
	}

	let mut children = processes
		.children
		.lock()
		.map_err(|_| "Script process state is unavailable".to_string())?;
	children.insert(id, child);

	Ok(true)
}

#[tauri::command]
pub async fn stop_script(
	id: u64,
	processes: State<'_, ScriptProcesses>,
) -> Result<bool, String> {
	let mut children = processes
		.children
		.lock()
		.map_err(|_| "Script process state is unavailable".to_string())?;

	let Some(mut child) = children.remove(&id) else {
		return Ok(false);
	};

	stop_child(&mut child)?;
	Ok(false)
}
