import Database from "@tauri-apps/plugin-sql";
import { Stronghold } from "@tauri-apps/plugin-stronghold";
import { appDataDir } from "@tauri-apps/api/path";

export type MysqlCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export const MYSQL_CREDENTIALS_VAULT_KEY = "mysql_credentials";
const STRONGHOLD_FILE = "credentials.stronghold";

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
  console.info(`[DB] Testing connection to ${credentials.host}:${credentials.port}/${credentials.database}`);
  const db = await Database.load(url);
  try {
    await db.select<Array<{ ok: number }>>("SELECT 1 AS ok");
    console.info("[DB] Connection test successful");
  } finally {
    await db.close();
  }
}

async function getStrongholdPath(): Promise<string> {
  const dataDir = await appDataDir();
  return `${dataDir}/${STRONGHOLD_FILE}`;
}

export async function loadSavedMysqlCredentials(): Promise<MysqlCredentials | null> {
  try {
    const path = await getStrongholdPath();
    console.info(`[DB] Loading credentials from Stronghold vault at ${path}`);
    
    // Load the Stronghold vault with empty password (credentials are encrypted at rest by the file itself)
    const vault = await Stronghold.load(path, "");
    
    const stored = await vault.loadCredential(MYSQL_CREDENTIALS_VAULT_KEY);
    
    // Stronghold stores credentials as raw bytes; parse the JSON
    if (!stored) {
      console.info("[DB] No saved credentials found in Stronghold vault");
      return null;
    }

    const credString = new TextDecoder().decode(new Uint8Array(stored));
    const raw = JSON.parse(credString) as unknown;

    if (
      raw &&
      typeof raw === "object" &&
      typeof (raw as Record<string, unknown>).host === "string" &&
      typeof (raw as Record<string, unknown>).user === "string" &&
      typeof (raw as Record<string, unknown>).database === "string" &&
      typeof (raw as Record<string, unknown>).port === "number" &&
      typeof (raw as Record<string, unknown>).password === "string"
    ) {
      console.info("[DB] Credentials loaded successfully from encrypted vault");
      return raw as MysqlCredentials;
    }
    return null;
  } catch (error) {
    console.error(`[DB] Failed to load credentials from Stronghold: ${String(error)}`);
    return null;
  }
}

export async function saveMysqlCredentials(credentials: MysqlCredentials): Promise<void> {
  try {
    const path = await getStrongholdPath();
    console.info(`[DB] Saving credentials to Stronghold vault at ${path}`);
    
    // Load or create the Stronghold vault with empty password
    const vault = await Stronghold.load(path, "");
    
    // Convert credentials to JSON string and encode as bytes
    const credString = JSON.stringify(credentials);
    const credBytes = new TextEncoder().encode(credString);
    
    // Store the credential in the vault (encrypted)
    await vault.saveCredential(MYSQL_CREDENTIALS_VAULT_KEY, Array.from(credBytes));
    
    console.info("[DB] Credentials saved successfully to encrypted Stronghold vault");
  } catch (error) {
    console.error(`[DB] Failed to save credentials to Stronghold: ${String(error)}`);
    throw error;
  }
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
