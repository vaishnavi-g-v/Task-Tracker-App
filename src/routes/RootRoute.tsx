import { Navigate } from "react-router-dom";
import { isTauri } from "@tauri-apps/api/core";
import { useBootstrap } from "../context/BootstrapContext";

export default function RootRoute(): JSX.Element {
  const { phase, connectionOk } = useBootstrap();

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm opacity-80">
        Checking database configuration…
      </div>
    );
  }

  if (!isTauri()) {
    return <Navigate to="/settings" replace />;
  }

  if (connectionOk) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/settings" replace />;
}
