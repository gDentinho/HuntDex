import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SavedHunt } from "./types";
import { DB_NAME, DB_VERSION, HUNTS_STORE, migrateDatabase } from "./migrations";

export interface HuntDexDB extends DBSchema {
  hunts: {
    key: string;
    value: SavedHunt;
    indexes: {
      player: string;
      startTimestamp: number;
      sessionId: number;
      duplicateKey: string;
    };
  };
}

let databasePromise: Promise<IDBPDatabase<HuntDexDB>> | undefined;

export function getDatabase(): Promise<IDBPDatabase<HuntDexDB>> {
  databasePromise ??= openDB<HuntDexDB>(DB_NAME, DB_VERSION, {
    upgrade: migrateDatabase,
    blocking() {
      void databasePromise?.then(database=>database.close());
      databasePromise = undefined;
    },
    terminated() {
      databasePromise = undefined;
    },
  }).catch(error=>{databasePromise=undefined;throw error;});
  return databasePromise;
}

export { HUNTS_STORE };
