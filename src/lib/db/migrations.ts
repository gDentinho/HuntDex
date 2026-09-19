import type { IDBPDatabase } from "idb";
import type { HuntDexDB } from "./index";

export const DB_NAME = "huntdex";
export const DB_VERSION = 1;
export const HUNTS_STORE = "hunts" as const;

export function migrateDatabase(
  database: IDBPDatabase<HuntDexDB>,
  oldVersion: number,
): void {
  if (oldVersion < 1) {
    const store = database.createObjectStore(HUNTS_STORE, { keyPath: "id" });
    store.createIndex("player", "player");
    store.createIndex("startTimestamp", "startTimestamp");
    store.createIndex("sessionId", "sessionId");
    store.createIndex("duplicateKey", "duplicateKey", { unique: true });
  }
}
