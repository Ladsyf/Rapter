use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Repository {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub path: String,
    pub scripts: Vec<Script>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Script {
    pub id: u64,
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
    pub scripts: Vec<Script>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRepositoryInput {
    pub name: String,
    pub description: String,
    pub path: String,
    pub scripts: Vec<Script>,
}
