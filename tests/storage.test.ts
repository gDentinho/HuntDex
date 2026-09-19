import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";
import type { PxGHuntData } from "../src/lib/pxg/types";
import {
  checkDuplicateHunt,
  clearAllHunts,
  createSavedHunt,
  deleteHunt,
  getAllHunts,
  getHunt,
  saveHunt,
} from "../src/lib/db/huntsRepository";

function hunt(overrides: Partial<NonNullable<PxGHuntData["Session"]>> = {}): PxGHuntData {
  return {
    Session: {
      "Session ID": 31,
      Start: "2026-09-18 21:23:46",
      "Duration seconds": 1800,
      Experience: 100_000,
      Profit: 20_000,
      Kills: 50,
      ...overrides,
    },
    Experience: [{ Player: "Misty", Experience: 100_000 }],
  };
}

describe("repositório de hunts", () => {
  beforeEach(async () => clearAllHunts());

  it("fallback usa métricas normalizadas dos arrays e duração equivalente", async () => {
    const a:PxGHuntData={Session:{Duration:"00:30:00"},Experience:[{Player:"P",Experience:100}]};
    const b:PxGHuntData={Session:{"Duration seconds":1800},Experience:[{Player:"P",Experience:100}]};
    await saveHunt(a);
    expect((await saveHunt(b)).status).toBe("duplicate");
    b.Experience![0].Experience=200;
    expect((await saveHunt(b)).status).toBe("saved");
  });

  it("salva, carrega e exclui uma hunt analisada", async () => {
    const result = await saveHunt(hunt());
    expect(result.status).toBe("saved");
    expect(result.hunt).toMatchObject({
      player: "Misty",
      sessionId: 31,
      start: "2026-09-18 21:23:46",
    });
    expect(result.hunt.analysis.financial.profit).toBe(20_000);
    expect(await getHunt(result.hunt.id)).toEqual(result.hunt);
    expect(await getAllHunts()).toEqual([result.hunt]);

    await deleteHunt(result.hunt.id);
    expect(await getHunt(result.hunt.id)).toBeUndefined();
  });

  it("retorna a hunt existente quando duas gravações concorrentes têm a mesma identidade", async () => {
    const results = await Promise.all([saveHunt(hunt()), saveHunt(hunt())]);
    expect(results.map((result) => result.status).sort()).toEqual([
      "duplicate",
      "saved",
    ]);
    expect(results[0].hunt.id).toBe(results[1].hunt.id);
    expect(await getAllHunts()).toHaveLength(1);
    expect(await checkDuplicateHunt(hunt())).toEqual(results[0].hunt);
  });

  it("usa duração, kills, XP e profit para distinguir hunts sem Session ID", async () => {
    const raw = hunt();
    delete raw.Session?.["Session ID"];
    const first = await saveHunt(raw);
    expect((await saveHunt(structuredClone(raw))).status).toBe("duplicate");
    const distinct = hunt({ Profit: 20_001 });
    delete distinct.Session?.["Session ID"];
    expect((await saveHunt(distinct)).status).toBe("saved");
    expect(await getAllHunts()).toHaveLength(2);
    expect(first.hunt.duplicateKey).not.toBe(
      createSavedHunt(distinct).duplicateKey,
    );
  });

  it("rejeita JSON bruto inválido antes de criar a hunt", () => {
    expect(() => createSavedHunt({ Session: { Profit: Number.NaN } })).toThrow(
      /campo Session\.Profit/i,
    );
  });
});
