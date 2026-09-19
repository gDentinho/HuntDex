import type { HuntBackup, HuntSettings, SavedHunt } from "../db/types";
import { createSavedHunt } from "../db/huntsRepository";

const INVALID_BACKUP = "Este arquivo não parece ser um backup válido do HuntDex.";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function validSettings(value: unknown): value is HuntSettings {
  if (!isRecord(value)) return false;
  const price = value.diamondPrice;
  return price === null || (typeof price === "number" && Number.isFinite(price) && price > 0);
}

export function normalizeBackup(value: unknown): HuntBackup {
  try {
    if (
      !isRecord(value) ||
      value.version !== "2.0" ||
      typeof value.exportedAt !== "string" ||
      !Number.isFinite(Date.parse(value.exportedAt)) ||
      !validSettings(value.settings) ||
      !Array.isArray(value.hunts)
    )
      throw new Error();

    const hunts = value.hunts.map((entry) => {
      if (!isRecord(entry) || !isRecord(entry.rawJson)) throw new Error();
      const id = typeof entry.id === "string" && entry.id.trim() ? entry.id : undefined;
      const createdAt =
        typeof entry.createdAt === "number" &&
        Number.isFinite(entry.createdAt) &&
        entry.createdAt >= 0
          ? entry.createdAt
          : undefined;
      return createSavedHunt(entry.rawJson, { id, createdAt });
    });
    return {
      version: "2.0",
      exportedAt: value.exportedAt,
      settings: { diamondPrice: value.settings.diamondPrice as number | null },
      hunts,
    };
  } catch {
    throw new Error(INVALID_BACKUP);
  }
}

export function exportBackup(hunts: SavedHunt[], settings: HuntSettings): HuntBackup {
  if (!validSettings(settings)) throw new Error(INVALID_BACKUP);
  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    settings: { ...settings },
    hunts,
  };
}

export function parseBackup(text: string): HuntBackup {
  try {
    return normalizeBackup(JSON.parse(text));
  } catch {
    throw new Error(INVALID_BACKUP);
  }
}

export { INVALID_BACKUP };
