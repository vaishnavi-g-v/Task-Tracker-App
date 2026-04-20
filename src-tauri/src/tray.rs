use tauri::{AppHandle, Manager, Runtime};   // Manager is needed for app.handle() in init_tray

pub fn init_tray<R: Runtime>(_app: &AppHandle<R>) {
    // Reserved for Phase 7 tray and widget controls.
}
