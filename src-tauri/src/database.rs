/// Returns the database URL based on the build profile.
/// In debug builds, uses `rapter-dev.db` to avoid mixing development data with production data.
/// In release builds, uses `rapter.db` for the actual app data.
pub fn get_db_url() -> String {
    let db_name = if cfg!(debug_assertions) {
        "rapter-dev.db"
    } else {
        "rapter.db"
    };
    format!("sqlite:{}", db_name)
}