import { analyzeHunt } from "../pxg/analytics";
import type { PxGHuntData,HuntAnalysis } from "../pxg/types";
import { validateHunt } from "../pxg/validators";
import { parseLocalStart } from "../analytics/period";
import { getDatabase, HUNTS_STORE } from "./index";
import type { SavedHunt } from "./types";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function duplicateKey(raw: PxGHuntData, analysis: HuntAnalysis): string {
  const player=analysis.player;
  const session = raw.Session ?? {};
  return session["Session ID"] !== undefined
    ? JSON.stringify([session["Session ID"], player, session.Start ?? null])
    : JSON.stringify([
        player,
        session.Start ?? null,
        analysis.session.durationSeconds,
        analysis.combat.kills,
        analysis.experience.total,
        analysis.financial.profit,
      ]);
}

export function createSavedHunt(
  raw: PxGHuntData,
  metadata: { id?: string; createdAt?: number } = {},
): SavedHunt {
  const validation = validateHunt(raw);
  if (!validation.ok) throw new Error(validation.message);
  const analysis = analyzeHunt(validation.data);
  const start = validation.data.Session?.Start;
  return {
    id: metadata.id ?? createId(),
    duplicateKey: duplicateKey(validation.data, analysis),
    sessionId: validation.data.Session?.["Session ID"],
    player: analysis.player,
    start,
    startTimestamp: parseLocalStart(start),
    createdAt: metadata.createdAt ?? Date.now(),
    rawJson: validation.data,
    analysis,
  };
}

export async function checkDuplicateHunt(raw: PxGHuntData): Promise<SavedHunt | undefined> {
  const candidate = createSavedHunt(raw);
  const database = await getDatabase();
  return database.getFromIndex(HUNTS_STORE, "duplicateKey", candidate.duplicateKey);
}

export async function saveHunt(
  raw: PxGHuntData,
): Promise<{ status: "saved" | "duplicate"; hunt: SavedHunt }> {
  const candidate = createSavedHunt(raw);
  const database = await getDatabase();
  try {
    const transaction = database.transaction(HUNTS_STORE, "readwrite");
    const existing = await transaction.store.index("duplicateKey").get(candidate.duplicateKey);
    if (existing) {
      await transaction.done;
      return { status: "duplicate", hunt: existing };
    }
    await transaction.store.add(candidate);
    await transaction.done;
    return { status: "saved", hunt: candidate };
  } catch (error) {
    if (error instanceof DOMException && error.name === "ConstraintError") {
      const existing = await database.getFromIndex(
        HUNTS_STORE,
        "duplicateKey",
        candidate.duplicateKey,
      );
      if (existing) return { status: "duplicate", hunt: existing };
    }
    throw error;
  }
}

export async function getHunt(id: string): Promise<SavedHunt | undefined> {
  return (await getDatabase()).get(HUNTS_STORE, id);
}

export async function getAllHunts(): Promise<SavedHunt[]> {
  return (await getDatabase()).getAll(HUNTS_STORE);
}

export async function deleteHunt(id: string): Promise<void> {
  await (await getDatabase()).delete(HUNTS_STORE, id);
}

export async function clearAllHunts(): Promise<void> {
  await (await getDatabase()).clear(HUNTS_STORE);
}
