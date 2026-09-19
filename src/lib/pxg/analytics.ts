import {
  formatDuration,
  formatNumber,
  formatPercent,
  parseDuration,
  safeDivide,
} from "../formatters";
import type {
  DamageEntry,
  DamageGroup,
  DropItem,
  EnemyDefeated,
  HuntAnalysis,
  HuntInsight,
  Metric,
  NormalizedEnemy,
  NormalizedItem,
  PxGHuntData,
} from "./types";

function sum<T>(rows: T[] | undefined, field: (row: T) => number): Metric {
  if (!rows) return null;
  const total = rows.reduce((acc, row) => acc + field(row), 0);
  return Number.isFinite(total) ? total : null;
}
const percent = (value: Metric, total: Metric): Metric => {
  const ratio = safeDivide(value, total);
  return ratio === null || !Number.isFinite(ratio * 100) ? null : ratio * 100;
};
function normalizeItems(
  rows: DropItem[] | undefined,
  total: Metric,
): NormalizedItem[] {
  const groups = new Map<string, NormalizedItem>();
  for (const row of rows ?? []) {
    const current = groups.get(row.Item);
    if (current) {
      current.variablePrice ||= current.unitPrice !== row["Unit price"];
      current.count += row.Count;
      current.total += row["Total price"];
      current.ignored ||= row.Ignored === true;
    } else
      groups.set(row.Item, {
        name: row.Item,
        count: row.Count,
        unitPrice: row["Unit price"],
        total: row["Total price"],
        share: null,
        ignored: row.Ignored === true,
        variablePrice: false,
      });
  }
  return Array.from(groups.values(), (row) => ({
    ...row,
    unitPrice:
      row.variablePrice && row.count > 0
        ? row.total / row.count
        : row.unitPrice,
    share: percent(row.total, total),
  })).sort((a, b) => b.total - a.total);
}
function normalizeEnemies(
  rows: EnemyDefeated[] | undefined,
  total: Metric,
): NormalizedEnemy[] {
  const groups = new Map<string, NormalizedEnemy>();
  for (const row of rows ?? []) {
    const current = groups.get(row.Enemy);
    if (current) {
      current.count += row.Count;
      current.rare ||= row.Rare;
      current.ignored ||= row.Ignored;
    } else
      groups.set(row.Enemy, {
        name: row.Enemy,
        count: row.Count,
        rare: row.Rare,
        ignored: row.Ignored,
        share: null,
      });
  }
  return Array.from(groups.values(), (row) => ({
    ...row,
    share: percent(row.count, total),
  })).sort((a, b) => b.count - a.count);
}
function aggregateDamage(
  rows: DamageEntry[] | undefined,
  dealt: Metric,
  taken: Metric,
) {
  const enemies = new Map<string, DamageGroup>(),
    elements = new Map<string, DamageGroup>();
  for (const row of rows ?? []) {
    for (const [groups, name] of [
      [enemies, row.Enemy],
      [elements, row.Element],
    ] as const) {
      const current = groups.get(name) ?? {
        name,
        dealt: 0,
        taken: 0,
        dealtShare: null,
        takenShare: null,
      };
      current.dealt += row["Damage dealt"];
      current.taken += row["Damage taken"];
      groups.set(name, current);
    }
  }
  const result = (groups: Map<string, DamageGroup>) =>
    Array.from(groups.values(), (row) => ({
      ...row,
      dealtShare: percent(row.dealt, dealt),
      takenShare: percent(row.taken, taken),
    })).sort((a, b) => b.dealt - a.dealt);
  return { damageByEnemy: result(enemies), damageByElement: result(elements) };
}

/** Session é a fonte principal. Arrays são fallback; ausência permanece null. */
export function analyzeHunt(data: PxGHuntData): HuntAnalysis {
  const s = data.Session ?? {};
  const duration = s["Duration seconds"] ?? parseDuration(s.Duration);
  const hours = duration === null ? null : duration / 3600;
  const rawGains = s["Raw gains"] ?? sum(data.Drops, (r) => r["Total price"]);
  const supplies = s.Supplies ?? sum(data.Supplies, (r) => r["Total price"]);
  const profit =
    s.Profit ??
    (rawGains !== null && supplies !== null ? rawGains - supplies : null);
  const kills = s.Kills ?? sum(data["Enemies Defeated"], (r) => r.Count);
  const rareKills =
    s["Rare kills"] ??
    sum(data["Enemies Defeated"], (r) => (r.Rare ? r.Count : 0));
  const experience = s.Experience ?? sum(data.Experience, (r) => r.Experience);
  const damageDealt =
    s["Damage dealt"] ?? sum(data.Damage, (r) => r["Damage dealt"]);
  const damageTaken =
    s["Damage taken"] ?? sum(data.Damage, (r) => r["Damage taken"]);
  const drops = normalizeItems(data.Drops, rawGains),
    supplyRows = normalizeItems(data.Supplies, supplies),
    enemies = normalizeEnemies(data["Enemies Defeated"], kills);
  const damage = aggregateDamage(data.Damage, damageDealt, damageTaken);
  const insights: HuntInsight[] = [];
  if (supplyRows[0]?.total > 0)
    insights.push({
      title: "Maior gasto",
      name: supplyRows[0].name,
      detail: `${formatNumber(supplyRows[0].total)}${supplyRows[0].share === null ? "" : ` · ${formatPercent(supplyRows[0].share)} dos supplies`}`,
      kind: "supply",
    });
  if (drops[0]?.total > 0)
    insights.push({
      title: "Drop mais valioso",
      name: drops[0].name,
      detail: `${formatNumber(drops[0].total)} em loot`,
      kind: "drop",
    });
  if (enemies[0]?.count > 0)
    insights.push({
      title: "Pokémon mais derrotado",
      name: enemies[0].name,
      detail: `${formatNumber(enemies[0].count)} kills`,
      kind: "enemy",
    });
  if (damage.damageByElement[0]?.dealt > 0)
    insights.push({
      title: "Principal fonte de dano",
      name: damage.damageByElement[0].name,
      detail: `${formatNumber(damage.damageByElement[0].dealt)} de dano causado`,
      kind: "element",
    });
  const warnings: string[] = [];
  const comparisons: [string, Metric, Metric][] = [
    ["Loot", s["Raw gains"] ?? null, sum(data.Drops, (r) => r["Total price"])],
    [
      "Supplies",
      s.Supplies ?? null,
      sum(data.Supplies, (r) => r["Total price"]),
    ],
    ["Kills", s.Kills ?? null, sum(data["Enemies Defeated"], (r) => r.Count)],
    [
      "Dano causado",
      s["Damage dealt"] ?? null,
      sum(data.Damage, (r) => r["Damage dealt"]),
    ],
    [
      "Dano recebido",
      s["Damage taken"] ?? null,
      sum(data.Damage, (r) => r["Damage taken"]),
    ],
  ];
  for (const [label, official, detail] of comparisons)
    if (
      official !== null &&
      detail !== null &&
      Math.abs(official - detail) > 0.01
    )
      warnings.push(
        `${label}: Session informa ${formatNumber(official)}; os registros somam ${formatNumber(detail)}. O total de Session foi mantido.`,
      );
  if ([...drops, ...supplyRows, ...enemies].some((r) => r.ignored))
    warnings.push(
      "Há registros marcados como Ignored. Eles são sinalizados nas tabelas e incluídos nos somatórios de fallback; os totais de Session continuam sendo prioritários.",
    );
  const player =
    [
      data.Experience?.[0]?.Player,
      data.Drops?.[0]?.Player,
      data.Supplies?.[0]?.Player,
      data.Damage?.[0]?.Player,
      data["Enemies Defeated"]?.[0]?.Player,
    ].find((p) => p?.trim()) ?? "Jogador desconhecido";
  return {
    player,
    session: {
      start: s.Start,
      durationSeconds: duration,
      durationFormatted: formatDuration(duration),
      status: s.Status,
      id: s["Session ID"],
      type: s["Session type"],
      pausedSeconds: s["Paused seconds"],
    },
    financial: {
      rawGains,
      supplies,
      profit,
      rawGainsPerHour: s["Raw gains per hour"] ?? safeDivide(rawGains, hours),
      suppliesPerHour: s["Supplies per hour"] ?? safeDivide(supplies, hours),
      profitPerHour: s["Profit per hour"] ?? safeDivide(profit, hours),
      profitPerMinute: safeDivide(
        profit,
        duration === null ? null : duration / 60,
      ),
      profitPerKill: safeDivide(profit, kills),
      lootPerKill: safeDivide(rawGains, kills),
      supplyPerKill: safeDivide(supplies, kills),
      lootSupplyRatio: safeDivide(rawGains, supplies),
    },
    experience: {
      total: experience,
      perHour: s["Experience per hour"] ?? safeDivide(experience, hours),
      perKill: safeDivide(experience, kills),
      timeToNextLevel:
        s["Time to next level"] ??
        (s["Time to next level seconds"] !== undefined
          ? formatDuration(s["Time to next level seconds"])
          : undefined),
    },
    combat: {
      kills,
      killsPerHour: s["Kills per hour"] ?? safeDivide(kills, hours),
      rareKills,
      rareKillsPerHour:
        s["Rare kills per hour"] ?? safeDivide(rareKills, hours),
      damageDealt,
      damageTaken,
      dps: s["Damage dealt per second"] ?? safeDivide(damageDealt, duration),
      damageTakenPerSecond:
        s["Damage taken per second"] ?? safeDivide(damageTaken, duration),
      damageDealtPerKill: safeDivide(damageDealt, kills),
      damageTakenPerKill: safeDivide(damageTaken, kills),
    },
    drops,
    supplies: supplyRows,
    enemies,
    ...damage,
    insights,
    warnings,
  };
}
