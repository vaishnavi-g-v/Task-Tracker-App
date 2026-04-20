import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import WidgetShell from "./components/widget/WidgetShell";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import RootRoute from "./routes/RootRoute";

export default function App(): JSX.Element {
  const windowLabel = isTauri() ? getCurrentWindow().label : "main";

  if (windowLabel === "widget") {
    return <WidgetShell />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRoute />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
