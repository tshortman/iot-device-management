import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export type Db = BetterSQLite3Database;

/** The handle Drizzle passes into a transaction callback. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type AppDatabase = Db & {
  $client: Database.Database;
};

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);

/**
 * Open a database, set pragmas and run migrations.
 */
export function openDatabase(path: string): AppDatabase {
  const sqlite = new Database(path);
  sqlite.pragma("foreign_keys = ON");
  // WAL lets reads carry on while a write is in progress.
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder });
  return db;
}
