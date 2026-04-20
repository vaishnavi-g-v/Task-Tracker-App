import { isTauri } from "@tauri-apps/api/core";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBootstrap } from "../context/BootstrapContext";
import {
  humanizeMysqlError,
  loadSavedMysqlCredentials,
  type MysqlCredentials,
  saveMysqlCredentials,
  testMysqlConnection
} from "../db/connection";

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred.";
}

function parsePort(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    return null;
  }
  return n;
}

export default function Settings(): JSX.Element {
  const navigate = useNavigate();
  const { bootstrapError, refreshBootstrap } = useBootstrap();
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }
    void (async () => {
      const saved = await loadSavedMysqlCredentials();
      if (saved) {
        setHost(saved.host);
        setPort(String(saved.port));
        setUser(saved.user);
        setPassword(saved.password);
        setDatabase(saved.database);
      }
    })();
  }, []);

  const connectionRefusedMessage =
    bootstrapError && bootstrapError.toLowerCase().startsWith("connection refused")
      ? bootstrapError
      : null;
  const otherBootstrapError =
    bootstrapError && !connectionRefusedMessage ? bootstrapError : null;

  async function submit(creds: MysqlCredentials): Promise<void> {
    setBusy(true);
    setFormError(null);
    try {
      await testMysqlConnection(creds);
      await saveMysqlCredentials(creds);
      await refreshBootstrap();
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setFormError(humanizeMysqlError(formatUnknownError(e)));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    const portNum = parsePort(port.trim());
    if (!portNum) {
      setFormError("Enter a valid port (1–65535).");
      return;
    }
    const h = host.trim();
    const u = user.trim();
    const d = database.trim();
    if (!h || !u || !d) {
      setFormError("Host, user, and database are required.");
      return;
    }
    void submit({
      host: h,
      port: portNum,
      user: u,
      password,
      database: d
    });
  }

  async function onRetry(): Promise<void> {
    const portNum = parsePort(port.trim());
    if (!portNum) {
      setFormError("Enter a valid port (1–65535).");
      return;
    }
    const h = host.trim();
    const u = user.trim();
    const d = database.trim();
    if (!h || !u || !d) {
      setFormError("Host, user, and database are required.");
      return;
    }
    await submit({
      host: h,
      port: portNum,
      user: u,
      password,
      database: d
    });
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Database settings</h1>
        <p className="mt-1 text-sm opacity-80">
          Connect to MySQL. Credentials are saved with the Tauri store plugin (Phase 2 will move the password to
          Stronghold).
        </p>
      </div>

      {!isTauri() && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Running in a browser preview: open the Tauri app to test the store and MySQL connection.
        </p>
      )}

      {connectionRefusedMessage && (
        <div className="space-y-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-3 text-sm">
          <p className="font-medium text-red-200">Connection refused</p>
          <p className="opacity-90">{connectionRefusedMessage}</p>
          <button
            type="button"
            disabled={busy || !isTauri()}
            onClick={() => void onRetry()}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {otherBootstrapError && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">{otherBootstrapError}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="opacity-80">Host</span>
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border border-slate-400/40 bg-white/80 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="opacity-80">Port</span>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border border-slate-400/40 bg-white/80 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="opacity-80">User</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            className="w-full rounded-md border border-slate-400/40 bg-white/80 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="opacity-80">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-400/40 bg-white/80 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="opacity-80">Database</span>
          <input
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border border-slate-400/40 bg-white/80 px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
          />
        </label>

        {formError && (
          <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-100">{formError}</p>
        )}

        <button
          type="submit"
          disabled={busy || !isTauri()}
          className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {busy ? "Connecting…" : "Connect and save"}
        </button>
      </form>
    </main>
  );
}
