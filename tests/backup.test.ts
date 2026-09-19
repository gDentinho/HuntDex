import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";
import type { HuntBackup, SavedHunt } from "../src/lib/db/types";
import type { PxGHuntData } from "../src/lib/pxg/types";
import { exportBackup, parseBackup } from "../src/lib/backup/exportBackup";
import { importBackup } from "../src/lib/backup/importBackup";
import {
  clearAllHunts,
  createSavedHunt,
  getAllHunts,
  saveHunt,
} from "../src/lib/db/huntsRepository";

function raw(id: number, profit = 100): PxGHuntData {
  return {
    Session: {
      "Session ID": id,
      Start: `2026-09-${String(id).padStart(2, "0")} 10:00:00`,
      "Duration seconds": 3600,
      Profit: profit,
      Experience: 1000,
      Kills: 10,
    },
    Experience: [{ Player: "Brock", Experience: 1000 }],
  };
}

function backup(hunts: SavedHunt[]): HuntBackup {
  return {
    version: "2.0",
    exportedAt: "2026-09-18T12:00:00.000Z",
    settings: { diamondPrice: 7500 },
    hunts,
  };
}

describe("backup HuntDex v2", () => {
  beforeEach(async () => clearAllHunts());

  it("exporta e reinterpreta um backup reconstruindo a análise", () => {
    const original = createSavedHunt(raw(18), { id: "hunt-18", createdAt: 123 });
    const exported = exportBackup([original], { diamondPrice: 7500 });
    expect(exported).toMatchObject({
      version: "2.0",
      settings: { diamondPrice: 7500 },
      hunts: [original],
    });
    const parsed = parseBackup(JSON.stringify(exported));
    expect(parsed).toMatchObject({
      version: "2.0",
      settings: { diamondPrice: 7500 },
    });
    expect(Number.isNaN(Date.parse(parsed.exportedAt))).toBe(false);
    expect(parsed.hunts[0]).toMatchObject({ id: "hunt-18", createdAt: 123 });
    expect(parsed.hunts[0].analysis.financial.profit).toBe(100);
  });

  it.each([
    ["JSON quebrado", "{"],
    ["versão incompatível", JSON.stringify({ ...backup([]), version: "1.0" })],
    ["data inválida", JSON.stringify({ ...backup([]), exportedAt: "ontem" })],
    ["preço não positivo", JSON.stringify({ ...backup([]), settings: { diamondPrice: 0 } })],
    ["hunt inválida", JSON.stringify(backup([{ ...createSavedHunt(raw(18)), rawJson: { Session: { Profit: Number.NaN } } }]))],
  ])("rejeita %s com mensagem amigável", (_label, text) => {
    expect(() => parseBackup(text)).toThrow(
      "Este arquivo não parece ser um backup válido do HuntDex.",
    );
  });

  it("mescla sem duplicar identidades existentes ou repetidas dentro do backup", async () => {
    await saveHunt(raw(18));
    const duplicate = createSavedHunt(raw(18), { id: "outro-id" });
    const fresh = createSavedHunt(raw(19), { id: "fresh" });
    const result = await importBackup(backup([duplicate, fresh, { ...fresh, id: "repetido" }]), "merge");
    expect(result).toEqual({ imported: 1, duplicates: 2 });
    expect((await getAllHunts()).map((hunt) => hunt.sessionId).sort()).toEqual([18, 19]);
  });

  it("preserva ambas as hunts quando um ID importado conflita com uma identidade diferente", async () => {
    const existing = (await saveHunt(raw(18))).hunt;
    const imported = createSavedHunt(raw(19), { id: existing.id });
    expect(await importBackup(backup([imported]), "merge")).toEqual({
      imported: 1,
      duplicates: 0,
    });
    const all = await getAllHunts();
    expect(all).toHaveLength(2);
    expect(new Set(all.map((hunt) => hunt.id)).size).toBe(2);
  });

  it("substitui todas as hunts em uma única operação", async () => {
    await saveHunt(raw(18));
    const result = await importBackup(backup([createSavedHunt(raw(19))]), "replace");
    expect(result).toEqual({ imported: 1, duplicates: 0 });
    expect((await getAllHunts()).map((hunt) => hunt.sessionId)).toEqual([19]);
  });

  it("não apaga os dados existentes quando qualquer hunt do backup é inválida", async () => {
    await saveHunt(raw(18));
    const payload = backup([
      createSavedHunt(raw(19)),
      { ...createSavedHunt(raw(20)), rawJson: { Session: { Kills: -1 } } },
    ]);
    await expect(importBackup(payload, "replace")).rejects.toThrow(
      "Este arquivo não parece ser um backup válido do HuntDex.",
    );
    expect((await getAllHunts()).map((hunt) => hunt.sessionId)).toEqual([18]);
  });
});
