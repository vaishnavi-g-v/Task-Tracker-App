#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tray;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_log::{Builder as LogBuilder, RotationStrategy, Target, TargetKind};

fn main() {
    tauri::Builder::default()
        .plugin(
            LogBuilder::default()
                .targets([
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview)
                ])
                .max_file_size(2 * 1024 * 1024)
                .rotation_strategy(RotationStrategy::KeepSome(5))
                .build()
        )
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            if app.get_webview_window("widget").is_none() {
                let _widget_window = WebviewWindowBuilder::new(
                    app,
                    "widget",
                    WebviewUrl::App("index.html".into()),
                )
                .title("Task Widget")
                .inner_size(360.0, 520.0)
                .decorations(false)
                .always_on_top(true)
                .visible(false)
                .build()?;
            }

            tray::init_tray(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run task tracker app");
}
