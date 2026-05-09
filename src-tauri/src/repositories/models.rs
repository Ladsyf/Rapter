use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Repository {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub path: String,
    pub scripts: Vec<Script>,
    pub date_created: String,
    pub parent_folder_id: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub parent_id: Option<u64>,
    pub date_created: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplorerContents {
    pub folder_id: Option<u64>,
    pub folders: Vec<Folder>,
    pub repositories: Vec<Repository>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Script {
    pub id: u64,
    pub repository_id: u64,
    pub name: String,
    pub description: String,
    pub command: String,
    pub category: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRepositoryInput {
    pub name: String,
    pub description: String,
    pub path: String,
    pub parent_folder_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRepositoryInput {
    pub name: String,
    pub description: String,
    pub path: String,
    pub parent_folder_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolderInput {
    pub name: String,
    pub description: String,
    pub parent_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderInput {
    pub name: String,
    pub description: String,
}