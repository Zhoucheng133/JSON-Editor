const MAX_JSON_FILE_SIZE: u64 = 10 * 1024 * 1024;

#[tauri::command]
fn read_json_file(path: String) -> Result<String, String> {
    let metadata = std::fs::metadata(&path).map_err(|e| format!("无法访问文件：{e}"))?;

    if !metadata.is_file() {
        return Err("请选择一个文件而不是文件夹".into());
    }

    if metadata.len() > MAX_JSON_FILE_SIZE {
        return Err("文件大小不能超过 10 MB".into());
    }

    std::fs::read_to_string(&path).map_err(|e| format!("无法读取文件：{e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_json_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
