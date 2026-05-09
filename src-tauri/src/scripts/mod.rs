use std::collections::HashMap;
use std::process::Child;
use std::sync::{Arc, Mutex};

pub mod commands;

#[derive(Default)]
pub struct ScriptProcesses {
	pub children: Mutex<HashMap<u64, Child>>,
	pub outputs: Arc<Mutex<HashMap<u64, String>>>,
}
