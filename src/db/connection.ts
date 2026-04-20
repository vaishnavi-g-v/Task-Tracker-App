import Database from "@tauri-apps/plugin-sql";
import { load } from "@tauri-apps/plugin-store";

export type MysqlCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export const SETTINGS_STORE_FILE = "settings.json";
export const MYSQL_CREDENTIALS_STORE_KEY = "mysqlCredentials";

/** Append SSL query parameters so transit encryption is required (see CURSOR_PLAN Phase 2). */
export function buildMysqlUrl(credentials: MysqlCredentials): string {
  const user = encodeURIComponent(credentials.user);
  const password = encodeURIComponent(credentials.password);
  const database = encodeURIComponent(credentials.database);
  const base = `mysql://${user}:${password}@${credentials.host}:${credentials.port}/${database}`;
  const params = new URLSearchParams({ "ssl-mode": "REQUIRED" });
  return `${base}?${params.toString()}`;
}

export async function testMysqlConnection(credentials: MysqlCredentials): Promise<void> {
  const url = buildMysqlUrl(credentials);
  const db = await Database.load(url);
  try {
    await db.select<Array<{ ok: number }>>("SELECT 1 AS ok");
  } finally {
    await db.close();
  }
}

export async function loadSavedMysqlCredentials(): Promise<MysqlCredentials | null> {
  const store = await load(SETTINGS_STORE_FILE);
  const raw = await store.get<MysqlCredentials>(MYSQL_CREDENTIALS_STORE_KEY);
  if (
    raw &&
    typeof raw.host === "string" &&
    typeof raw.user === "string" &&
    typeof raw.database === "string" &&
    typeof raw.port === "number" &&
    typeof raw.password === "string"
  ) {
    return raw;
  }
  return null;
}

export async function saveMysqlCredentials(credentials: MysqlCredentials): Promise<void> {
  const store = await load(SETTINGS_STORE_FILE);
  await store.set(MYSQL_CREDENTIALS_STORE_KEY, credentials);
  await store.save();
}

export function humanizeMysqlError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("connection refused") || m.includes("actively refused") || m.includes("10061")) {
    return "Connection refused. Check that MySQL is running and the host and port are correct.";
  }
  if (m.includes("access denied")) {
    return "Access denied. Check username, password, and database privileges.";
  }
  if (m.includes("unknown database")) {
    return "Unknown database. Create the database or correct the name.";
  }
  if (m.includes("ssl") || m.includes("tls")) {
    return "SSL/TLS error. The server must allow encrypted connections (ssl-mode=REQUIRED).";
  }
  return message;
}
