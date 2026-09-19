import { getSupabaseClient } from "@/lib/supabase/client";
import { createSavedHunt } from "@/lib/db/huntsRepository";
import type { HuntBackup, HuntSettings, SavedHunt } from "@/lib/db/types";
import type { PxGHuntData } from "@/lib/pxg/types";
import { normalizeBackup } from "@/lib/backup/exportBackup";
import { fromCloudHuntRow, toCloudHuntRow, type CloudHuntRow } from "./serialization";

const HUNTS_TABLE = "hunts";
const SETTINGS_TABLE = "user_settings";
const PAGE_SIZE = 1000;
const WRITE_CHUNK = 200;

function client() {
  const value = getSupabaseClient();
  if (!value) throw new Error("Supabase não configurado.");
  return value;
}

export async function getCloudHunts(userId: string): Promise<SavedHunt[]> {
  const rows: Array<Pick<CloudHuntRow, "id" | "created_at_ms" | "raw_json">> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client()
      .from(HUNTS_TABLE)
      .select("id,created_at_ms,raw_json")
      .eq("user_id", userId)
      .order("start_timestamp", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<Pick<CloudHuntRow, "id" | "created_at_ms" | "raw_json">>;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows.map(fromCloudHuntRow);
}

export async function saveCloudHunt(
  userId: string,
  raw: PxGHuntData,
): Promise<{ status: "saved" | "duplicate"; hunt: SavedHunt }> {
  const candidate = createSavedHunt(raw);
  const db = client();
  const { data: existing, error: lookupError } = await db
    .from(HUNTS_TABLE)
    .select("id,created_at_ms,raw_json")
    .eq("user_id", userId)
    .eq("duplicate_key", candidate.duplicateKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    return {
      status: "duplicate",
      hunt: fromCloudHuntRow(existing as Pick<CloudHuntRow, "id" | "created_at_ms" | "raw_json">),
    };
  }

  const { error } = await db.from(HUNTS_TABLE).insert(toCloudHuntRow(userId, candidate));
  if (!error) return { status: "saved", hunt: candidate };

  if (error.code === "23505") {
    const { data: raced, error: racedError } = await db
      .from(HUNTS_TABLE)
      .select("id,created_at_ms,raw_json")
      .eq("user_id", userId)
      .eq("duplicate_key", candidate.duplicateKey)
      .maybeSingle();
    if (racedError) throw racedError;
    if (raced) {
      return {
        status: "duplicate",
        hunt: fromCloudHuntRow(raced as Pick<CloudHuntRow, "id" | "created_at_ms" | "raw_json">),
      };
    }
  }
  throw error;
}

export async function deleteCloudHunt(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from(HUNTS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function getCloudSettings(userId: string): Promise<HuntSettings> {
  const { data, error } = await client()
    .from(SETTINGS_TABLE)
    .select("diamond_price")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const price = data?.diamond_price;
  return {
    diamondPrice:
      typeof price === "number"
        ? price
        : typeof price === "string" && Number.isFinite(Number(price))
          ? Number(price)
          : null,
  };
}

export async function setCloudSettings(userId: string, settings: HuntSettings): Promise<void> {
  const { error } = await client()
    .from(SETTINGS_TABLE)
    .upsert(
      {
        user_id: userId,
        diamond_price: settings.diamondPrice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

export async function mergeHuntsToCloud(
  userId: string,
  hunts: SavedHunt[],
): Promise<{ imported: number; duplicates: number }> {
  if (!hunts.length) return { imported: 0, duplicates: 0 };
  const existing = await getCloudHunts(userId);
  const keys = new Set(existing.map((hunt) => hunt.duplicateKey));
  const ids = new Set(existing.map((hunt) => hunt.id));
  const fresh: SavedHunt[] = [];
  let duplicates = 0;
  for (const source of hunts) {
    if (keys.has(source.duplicateKey)) {
      duplicates++;
      continue;
    }
    let hunt = source;
    while (ids.has(hunt.id)) {
      hunt = createSavedHunt(hunt.rawJson, { createdAt: hunt.createdAt });
    }
    keys.add(hunt.duplicateKey);
    ids.add(hunt.id);
    fresh.push(hunt);
  }
  if (!fresh.length) return { imported: 0, duplicates };

  let imported = 0;
  for (let index = 0; index < fresh.length; index += WRITE_CHUNK) {
    const chunk = fresh.slice(index, index + WRITE_CHUNK);
    const { error } = await client()
      .from(HUNTS_TABLE)
      .insert(chunk.map((hunt) => toCloudHuntRow(userId, hunt)));
    if (!error) {
      imported += chunk.length;
      continue;
    }
    if (error.code !== "23505") throw error;

    const afterRace = await getCloudHunts(userId);
    const afterKeys = new Set(afterRace.map((hunt) => hunt.duplicateKey));
    const remaining = chunk.filter((hunt) => !afterKeys.has(hunt.duplicateKey));
    duplicates += chunk.length - remaining.length;
    if (remaining.length) {
      const { error: retryError } = await client()
        .from(HUNTS_TABLE)
        .insert(remaining.map((hunt) => toCloudHuntRow(userId, hunt)));
      if (retryError) throw retryError;
      imported += remaining.length;
    }
  }
  return { imported, duplicates };
}

export async function importCloudBackup(
  userId: string,
  backup: HuntBackup,
  mode: "merge" | "replace",
): Promise<{ imported: number; duplicates: number }> {
  const normalized = normalizeBackup(backup);
  if (mode === "merge") return mergeHuntsToCloud(userId, normalized.hunts);

  const result = await mergeHuntsToCloud(userId, normalized.hunts);
  const wanted = new Set(normalized.hunts.map((hunt) => hunt.duplicateKey));
  const current = await getCloudHunts(userId);
  const removeIds = current.filter((hunt) => !wanted.has(hunt.duplicateKey)).map((hunt) => hunt.id);
  for (let index = 0; index < removeIds.length; index += WRITE_CHUNK) {
    const { error } = await client()
      .from(HUNTS_TABLE)
      .delete()
      .eq("user_id", userId)
      .in("id", removeIds.slice(index, index + WRITE_CHUNK));
    if (error) throw error;
  }
  return result;
}
