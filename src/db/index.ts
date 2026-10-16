import { drizzle as drizzleD1, type DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle as drizzleBetter, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Tipos de Workers sin instalar @cloudflare/workers-types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function require(id: string): any;
type D1DatabaseLike = unknown;

type AnyDb = DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema>;

// Cache para dev local (evita abrir el archivo en cada request con `next dev`).
const globalForDb = globalThis as typeof globalThis & {
  __localSqliteDb?: AnyDb;
};

function getLocalDb(): AnyDb {
  if (globalForDb.__localSqliteDb) return globalForDb.__localSqliteDb;

  // Solo se ejecuta en runtime Node (next dev / build). Nunca en Workers,
  // porque en Workers getDb() retorna D1 antes de llegar aquí.
  const Database = require("better-sqlite3");
  const { mkdirSync } = require("node:fs");
  const { dirname } = require("node:path");

  const path: string = process.env.LOCAL_DB_PATH ?? "./local.db";
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    // ignore
  }

  const sqlite = new Database(path);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rescue_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      city TEXT NOT NULL,
      pickup_area TEXT NOT NULL,
      offer_type TEXT NOT NULL,
      discount_percent INTEGER,
      quantity TEXT NOT NULL DEFAULT '1 bolsa',
      contact TEXT NOT NULL DEFAULT '',
      expires_at INTEGER NOT NULL,
      is_reserved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  const db = drizzleBetter(sqlite, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__localSqliteDb = db;
  }
  return db;
}

/**
 * Resuelve la DB según el entorno:
 * - Cloudflare Workers (prod/preview): D1 via binding `DB`.
 * - `next dev` / build local: SQLite en archivo via better-sqlite3.
 */
export function getDb(): AnyDb {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as { DB?: D1DatabaseLike };
    if (env?.DB) {
      return drizzleD1(env.DB as never, { schema });
    }
  } catch {
    // No estamos en Workers (dev local) -> fallback abajo.
  }
  return getLocalDb();
}

// Compat: el código existente hace `import { db } from "@/db"`.
// En Workers cada request resuelve su propio binding D1, así que usamos un Proxy lazy.
export const db = new Proxy({} as AnyDb, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
}) as AnyDb;
