import { describe, expect, it } from "vitest";
import { createSavedHunt } from "../src/lib/db/huntsRepository";
import { fromCloudHuntRow, toCloudHuntRow } from "../src/lib/cloud/serialization";
import type { PxGHuntData } from "../src/lib/pxg/types";

const raw: PxGHuntData = {
  Session: {
    "Session ID": 1742,
    Start: "2026-09-18 21:23:46",
    "Duration seconds": 1769,
    Profit: -8203,
    Experience: 194023,
    Kills: 344,
  },
  Experience: [{ Player: "Spectral Flame", Experience: 194023 }],
};

describe("serialização Supabase", () => {
  it("preserva identidade, JSON bruto e createdAt", () => {
    const hunt = createSavedHunt(raw, { id: "hunt-cloud", createdAt: 123456 });
    const row = toCloudHuntRow("00000000-0000-0000-0000-000000000001", hunt);

    expect(row).toMatchObject({
      id: "hunt-cloud",
      session_id: 1742,
      player: "Spectral Flame",
      created_at_ms: 123456,
      duplicate_key: hunt.duplicateKey,
      raw_json: raw,
    });

    const restored = fromCloudHuntRow(row);
    expect(restored).toMatchObject({
      id: hunt.id,
      createdAt: hunt.createdAt,
      duplicateKey: hunt.duplicateKey,
      player: "Spectral Flame",
    });
    expect(restored.analysis.financial.profit).toBe(-8203);
  });
});
