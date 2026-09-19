import { createSavedHunt } from "@/lib/db/huntsRepository";
import type { SavedHunt } from "@/lib/db/types";
import type { PxGHuntData } from "@/lib/pxg/types";

export interface CloudHuntRow {
  user_id: string;
  id: string;
  duplicate_key: string;
  session_id: number | null;
  player: string;
  start_text: string | null;
  start_timestamp: number | null;
  created_at_ms: number | string;
  raw_json: PxGHuntData;
}

export function toCloudHuntRow(userId: string, hunt: SavedHunt): CloudHuntRow {
  return {
    user_id: userId,
    id: hunt.id,
    duplicate_key: hunt.duplicateKey,
    session_id: hunt.sessionId ?? null,
    player: hunt.player,
    start_text: hunt.start ?? null,
    start_timestamp: hunt.startTimestamp ?? null,
    created_at_ms: hunt.createdAt,
    raw_json: hunt.rawJson,
  };
}

export function fromCloudHuntRow(row: Pick<CloudHuntRow, "id" | "created_at_ms" | "raw_json">): SavedHunt {
  return createSavedHunt(row.raw_json, {
    id: row.id,
    createdAt: Number(row.created_at_ms),
  });
}
