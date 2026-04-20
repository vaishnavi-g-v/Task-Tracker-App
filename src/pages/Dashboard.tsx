import { isTauri } from "@tauri-apps/api/core";
import { Navigate, Link } from "react-router-dom";
import { useBootstrap } from "../context/BootstrapContext";

export default function Dashboard(): JSX.Element {
  const { phase, connectionOk } = useBootstrap();

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm opacity-80">
        Loading…
      </div>
    );
  }

  if (!isTauri() || !connectionOk) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm opacity-80">You are connected to MySQL. The task grid arrives in Phase 4.</p>
      <Link to="/settings" className="text-sm text-sky-500 underline hover:text-sky-400">
        Database settings
      </Link>
    </main>
  );
}
