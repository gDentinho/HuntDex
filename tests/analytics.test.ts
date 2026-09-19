import { describe, expect, it } from "vitest";
import { parseHunt } from "../src/lib/pxg/parser";
import { analyzeHunt } from "../src/lib/pxg/analytics";
import {
  formatNumber,
  formatPercent,
  formatStart,
  parseDuration,
  formatDuration,
} from "../src/lib/formatters";
import { exampleHunt } from "../src/data/exampleHunt";

describe("sessão obrigatória do PxG", () => {
  it("preserva todos os totais e taxas oficiais, mesmo com arredondamento nos drops", () => {
    const a = analyzeHunt(exampleHunt);
    expect(a.player).toBe("Spectral Flame");
    expect(a.session.durationSeconds).toBe(1769);
    expect(a.financial).toMatchObject({
      rawGains: 11436,
      supplies: 19639,
      profit: -8203,
      rawGainsPerHour: 23273,
      suppliesPerHour: 39966,
      profitPerHour: -16693,
    });
    expect(a.experience).toMatchObject({
      total: 194023,
      perHour: 394846,
      timeToNextLevel: "01:12:15",
    });
    expect(a.combat).toMatchObject({
      kills: 344,
      killsPerHour: 700,
      rareKills: 2,
      rareKillsPerHour: 4,
      damageDealt: 2341130,
      damageTaken: 272869,
      dps: 1323,
      damageTakenPerSecond: 154,
    });
    expect(a.enemies.reduce((sum, row) => sum + row.count, 0)).toBe(344);
    expect(a.drops.reduce((sum, row) => sum + row.total, 0)).toBe(11436.5);
  });
  it("calcula fallbacks usando os arrays quando Session está ausente", () => {
    const a = analyzeHunt({
      ...exampleHunt,
      Session: { Duration: "00:29:29" },
    });
    expect(a.financial.rawGains).toBe(11436.5);
    expect(a.financial.supplies).toBe(19639);
    expect(a.financial.profit).toBe(-8202.5);
    expect(a.financial.profitPerHour).toBeCloseTo(-8202.5 / (1769 / 3600));
    expect(a.combat.kills).toBe(344);
    expect(a.experience.total).toBe(194023);
    expect(a.combat.damageDealt).toBe(2341130);
    expect(a.combat.damageTaken).toBe(272869);
  });
  it("considera zero em Session uma informação presente", () => {
    const a = analyzeHunt({
      ...exampleHunt,
      Session: {
        Profit: 0,
        Kills: 0,
        Experience: 0,
        "Duration seconds": 0,
        "Raw gains": 0,
        Supplies: 0,
        "Profit per hour": 0,
        "Damage dealt": 0,
      },
    });
    expect(a.financial.profit).toBe(0);
    expect(a.financial.rawGains).toBe(0);
    expect(a.combat.damageDealt).toBe(0);
    expect(a.financial.profitPerHour).toBe(0);
    expect(a.combat.killsPerHour).toBeNull();
    expect(a.financial.profitPerKill).toBeNull();
    expect(a.financial.lootSupplyRatio).toBeNull();
  });
  it("calcula métricas por kill e minuto sem inventar relações entre item e inimigo", () => {
    const a = analyzeHunt(exampleHunt);
    expect(a.financial.profitPerKill).toBeCloseTo(-8203 / 344);
    expect(a.financial.profitPerMinute).toBeCloseTo(-8203 / (1769 / 60));
    expect(a.experience.perKill).toBeCloseTo(194023 / 344);
    expect(a.combat.damageDealtPerKill).toBeCloseTo(2341130 / 344);
    expect(a.financial.lootSupplyRatio).toBeCloseTo(11436 / 19639);
    expect(a.insights.find((i) => i.title === "Maior gasto")?.name).toBe(
      "Revive",
    );
  });
});

describe("agregação e dados parciais", () => {
  it("evita percentuais não finitos com denominadores extremamente pequenos", () => {
    const a = analyzeHunt({
      Session: { "Raw gains": 1e-305 },
      Drops: [
        {
          Item: "Gem",
          Count: 1,
          "Unit price": 100,
          "Total price": 100,
          Player: "P",
          Ignored: null,
        },
      ],
    });
    expect(a.drops[0].share).toBeNull();
    expect(formatPercent(Infinity)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
  it("mantém prioridade de identificação e não interpreta campos desconhecidos", () => {
    const copy = structuredClone(exampleHunt);
    copy.Experience = [];
    copy.Drops![0].Player = "Jogador dos drops";
    expect(analyzeHunt(copy).player).toBe("Jogador dos drops");
    copy.Drops = [];
    expect(analyzeHunt(copy).player).toBe("Spectral Flame");
  });
  it("não desconta pausas novamente e prioriza duração em segundos", () => {
    const a = analyzeHunt({
      Session: {
        "Duration seconds": 3600,
        Duration: "02:00:00",
        "Paused seconds": 1800,
        "Raw gains": 1200,
      },
    });
    expect(a.financial.rawGainsPerHour).toBe(1200);
    expect(a.session.durationSeconds).toBe(3600);
  });
  it("agrega dano por inimigo e elemento sem misturar dano recebido com causado", () => {
    const a = analyzeHunt({
      Damage: [
        {
          Enemy: "Alakazam",
          Element: "Ghost",
          Player: "P",
          "Damage dealt": 100,
          "Damage taken": 10,
        },
        {
          Enemy: "Alakazam",
          Element: "Fire",
          Player: "P",
          "Damage dealt": 50,
          "Damage taken": 20,
        },
        {
          Enemy: "Hypno",
          Element: "Ghost",
          Player: "P",
          "Damage dealt": 25,
          "Damage taken": 5,
        },
      ],
    });
    expect(a.damageByEnemy.find((r) => r.name === "Alakazam")).toMatchObject({
      dealt: 150,
      taken: 30,
    });
    expect(a.damageByElement.find((r) => r.name === "Ghost")).toMatchObject({
      dealt: 125,
      taken: 15,
    });
    expect(a.damageByEnemy[0].dealtShare).toBeCloseTo((150 / 175) * 100);
    expect(a.damageByEnemy[0].takenShare).toBeCloseTo((30 / 35) * 100);
  });
  it("não transforma áreas ausentes em métricas zero", () => {
    const a = analyzeHunt({
      Session: { "Duration seconds": 1200 },
      Drops: [],
      Supplies: [],
      "Enemies Defeated": [],
    });
    expect(a.financial.profit).toBe(0);
    expect(a.combat.kills).toBe(0);
    expect(a.experience.total).toBeNull();
    expect(a.combat.damageDealt).toBeNull();
    expect(a.financial.profitPerKill).toBeNull();
    expect(a.player).toBe("Jogador desconhecido");
  });
  it("preserva itens gratuitos e identifica raros pelo campo Rare", () => {
    const a = analyzeHunt(exampleHunt);
    expect(a.supplies.find((r) => r.name === "Empty Yume Ball")).toMatchObject({
      count: 2,
      total: 0,
    });
    expect(a.enemies.filter((r) => r.rare).map((r) => r.name)).toEqual([
      "Shiny Alakazam",
      "Shiny Hypno",
    ]);
  });
  it("agrega itens repetidos, contabiliza todos os registros e sinaliza Ignored", () => {
    const a = analyzeHunt({
      Drops: [
        {
          Item: "Gem",
          Count: 2,
          "Unit price": 2,
          "Total price": 4,
          Player: "P",
          Ignored: false,
        },
        {
          Item: "Gem",
          Count: 1,
          "Unit price": 3,
          "Total price": 3,
          Player: "P",
          Ignored: true,
        },
      ],
    });
    expect(a.drops[0]).toMatchObject({
      count: 3,
      total: 7,
      unitPrice: 7 / 3,
      ignored: true,
      variablePrice: true,
    });
    expect(a.financial.rawGains).toBe(7);
    expect(a.financial.profit).toBeNull();
  });
  it("funciona com nomes que colidem com propriedades de objetos", () => {
    const a = analyzeHunt({
      Damage: [
        {
          Enemy: "__proto__",
          Element: "constructor",
          Player: "P",
          "Damage dealt": 20,
          "Damage taken": 10,
        },
      ],
    });
    expect(a.damageByEnemy[0].dealt).toBe(20);
    expect(a.damageByElement[0].taken).toBe(10);
  });
});

describe("validação do JSON", () => {
  it("aceita o exemplo e campos extras em todos os níveis", () => {
    expect(
      parseHunt(
        JSON.stringify({
          ...exampleHunt,
          Future: { foo: true },
          Session: { ...exampleHunt.Session, "New field": 42 },
        }),
      ).ok,
    ).toBe(true);
  });
  it("diferencia erro de sintaxe, estrutura desconhecida e sessão vazia", () => {
    expect(parseHunt('{"Drops":')).toMatchObject({ ok: false, kind: "syntax" });
    expect(parseHunt('{"foo":1}')).toMatchObject({
      ok: false,
      kind: "structure",
    });
    expect(parseHunt('{"Drops":[],"Session":{}}')).toMatchObject({
      ok: false,
      kind: "empty",
    });
  });
  it("aceita sessão parcial com duração e rejeita valores conhecidos inválidos", () => {
    expect(
      parseHunt('{"Session":{"Duration seconds":1200},"Drops":[]}').ok,
    ).toBe(true);
    expect(parseHunt('{"Session":{"Profit":"100"}}')).toMatchObject({
      ok: false,
      kind: "fields",
    });
    expect(parseHunt('{"Session":{"Profit":1e400}}').ok).toBe(false);
    expect(parseHunt('{"Session":{"Kills":-1}}').ok).toBe(false);
    expect(parseHunt('{"Session":{"Duration":"00:99:10"}}').ok).toBe(false);
    expect(parseHunt('{"Drops":[{"Item":"Gem"}]}').ok).toBe(false);
    expect(parseHunt('{"Damage":null}').ok).toBe(false);
  });
  it("valida flags e números de todos os arrays", () => {
    const invalid = structuredClone(exampleHunt);
    // Simula dado externo cujo tipo só é conhecido depois da validação.
    Object.assign(invalid["Enemies Defeated"]![0], { Rare: "yes" });
    expect(parseHunt(JSON.stringify(invalid)).ok).toBe(false);
  });
  it("não considera apenas campos desconhecidos como dados suficientes", () => {
    expect(parseHunt('{"Session":{"Future":123}}')).toMatchObject({
      ok: false,
      kind: "empty",
    });
  });
});

describe("formatação local", () => {
  it("formata números pt-BR e preserva casas decimais úteis", () => {
    expect(formatNumber(2341130)).toBe("2.341.130");
    expect(formatNumber(2415.5)).toBe("2.415,5");
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(Infinity)).toBe("—");
  });
  it("converte duração sem tratar zero como ausência", () => {
    expect(parseDuration("00:29:29")).toBe(1769);
    expect(parseDuration("01:00:00")).toBe(3600);
    expect(parseDuration("00:90:00")).toBeNull();
    expect(formatDuration(1769)).toBe("29:29");
    expect(formatDuration(3601)).toBe("01:00:01");
    expect(formatDuration(0)).toBe("00:00");
  });
  it("exibe o horário exportado sem conversão de timezone", () => {
    expect(formatStart("2026-09-18 21:23:46")).toBe("18/09/2026 às 21:23");
  });
});
