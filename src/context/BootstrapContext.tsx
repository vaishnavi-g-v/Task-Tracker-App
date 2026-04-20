import { isTauri } from "@tauri-apps/api/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  humanizeMysqlError,
  loadSavedMysqlCredentials,
  testMysqlConnection
} from "../db/connection";

export type BootstrapPhase = "loading" | "ready";

type BootstrapContextValue = {
  phase: BootstrapPhase;
  connectionOk: boolean;
  bootstrapError: string | null;
  refreshBootstrap: () => Promise<void>;
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred.";
}

export function BootstrapProvider({ children }: { children: ReactNode }): JSX.Element {
  const [phase, setPhase] = useState<BootstrapPhase>("loading");
  const [connectionOk, setConnectionOk] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const refreshBootstrap = useCallback(async () => {
    setPhase("loading");
    setBootstrapError(null);
    try {
      if (!isTauri()) {
        setConnectionOk(false);
        setPhase("ready");
        return;
      }
      const saved = await loadSavedMysqlCredentials();
      if (!saved) {
        setConnectionOk(false);
        setPhase("ready");
        return;
      }
      await testMysqlConnection(saved);
      setConnectionOk(true);
    } catch (e) {
      setConnectionOk(false);
      setBootstrapError(humanizeMysqlError(formatUnknownError(e)));
    } finally {
      setPhase("ready");
    }
  }, []);

  useEffect(() => {
    void refreshBootstrap();
  }, [refreshBootstrap]);

  const value = useMemo<BootstrapContextValue>(
    () => ({
      phase,
      connectionOk,
      bootstrapError,
      refreshBootstrap
    }),
    [phase, connectionOk, bootstrapError, refreshBootstrap]
  );

  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): BootstrapContextValue {
  const ctx = useContext(BootstrapContext);
  if (!ctx) {
    throw new Error("useBootstrap must be used within BootstrapProvider");
  }
  return ctx;
}
