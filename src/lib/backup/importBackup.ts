import { getDatabase, HUNTS_STORE } from "../db";
import type { HuntBackup, SavedHunt } from "../db/types";
import { normalizeBackup } from "./exportBackup";

function freshId(used: Set<string>): string {
  let id: string;
  do {
    id = globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  } while (used.has(id));
  return id;
}

export async function importBackup(
  backup: HuntBackup,
  mode: "merge" | "replace",
): Promise<{ imported: number; duplicates: number }> {
  const normalized = normalizeBackup(backup);
  const database = await getDatabase();
  const transaction = database.transaction(HUNTS_STORE, "readwrite");
  const store = transaction.store;
  const existing = mode === "merge" ? await store.getAll() : [];
  const keys = new Set(existing.map((hunt) => hunt.duplicateKey));
  const ids = new Set(existing.map((hunt) => hunt.id));
  const additions: SavedHunt[] = [];
  let duplicates = 0;

  for (const source of normalized.hunts) {
    if (keys.has(source.duplicateKey)) {
      duplicates++;
      continue;
    }
    const hunt = ids.has(source.id) ? { ...source, id: freshId(ids) } : source;
    keys.add(hunt.duplicateKey);
    ids.add(hunt.id);
    additions.push(hunt);
  }

  if (mode === "replace") await store.clear();
  for (const hunt of additions) await store.add(hunt);
  await transaction.done;
  return { imported: additions.length, duplicates };
}
