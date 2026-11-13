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

/// 保存 JSON 到磁盘：先校验格式，再原子写入，避免写坏原文件
#[tauri::command]
fn save_json_file(path: String, content: String) -> Result<(), String> {
    serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|e| format!("JSON 格式错误：{e}"))?;

    let target = std::path::Path::new(&path);

    if target.as_os_str().is_empty() {
        return Err("文件路径无效".into());
    }
    if target.is_dir() {
        return Err("目标路径是一个文件夹".into());
    }
    if let Some(parent) = target.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            return Err("目标文件夹不存在".into());
        }
    }

    let temp = target.with_extension("json.tmp");
    std::fs::write(&temp, content.as_bytes()).map_err(|e| format!("无法写入文件：{e}"))?;
    std::fs::rename(&temp, target).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        format!("无法保存文件：{e}")
    })?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_json_file, save_json_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
