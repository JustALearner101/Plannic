use std::fs;
use std::path::Path;

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
  fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
  if let Some(parent) = Path::new(&path).parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create parent dir: {}", e))?;
  }
  fs::write(&path, content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
fn read_directory(path: String) -> Result<Vec<String>, String> {
  let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read dir {}: {}", path, e))?;
  let mut filenames = Vec::new();
  for entry in entries.flatten() {
    if let Ok(name) = entry.file_name().into_string() {
      filenames.push(name);
    }
  }
  Ok(filenames)
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
  fs::create_dir_all(&path).map_err(|e| format!("Failed to create dir {}: {}", path, e))
}

#[tauri::command]
fn file_exists(path: String) -> Result<bool, String> {
  Ok(Path::new(&path).exists())
}

#[tauri::command]
fn pick_project_folder() -> Result<Option<String>, String> {
  #[cfg(windows)]
  {
    let folder = rfd::FileDialog::new()
      .set_title("Select Project Folder")
      .pick_folder();
    Ok(folder.map(|p| p.to_string_lossy().to_string()))
  }
  #[cfg(not(windows))]
  {
    Err("pick_project_folder is native to Windows; fallback to tauri-plugin-dialog".to_string())
  }
}

#[tauri::command]
fn remove_file(path: String) -> Result<(), String> {
  if Path::new(&path).exists() {
    fs::remove_file(&path).map_err(|e| format!("Failed to remove {}: {}", path, e))?;
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      read_text_file,
      write_text_file,
      read_directory,
      create_directory,
      file_exists,
      pick_project_folder,
      remove_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
