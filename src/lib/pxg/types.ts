export interface DropItem {
  "Unit price": number;
  "Total price": number;
  Ignored: boolean | null;
  Item: string;
  Player: string;
  Count: number;
}
export type SupplyItem = DropItem;
export interface DamageEntry {
  "Damage dealt": number;
  Enemy: string;
  Element: string;
  Player: string;
  "Damage taken": number;
}
export interface EnemyDefeated {
  Rare: boolean;
  Enemy: string;
  Ignored: boolean;
  Player: string;
  Count: number;
}
export interface ExperienceEntry {
  Player: string;
  Experience: number;
}
export interface SessionData {
  Status?: string;
  "Time to next level"?: string;
  Profit?: number;
  "Time to next level seconds"?: number;
  "Damage taken"?: number;
  "Session type"?: string;
  "Paused seconds"?: number;
  Supplies?: number;
  "Session ID"?: number;
  "Supplies per hour"?: number;
  "Profit per hour"?: number;
  "Duration seconds"?: number;
  Duration?: string;
  Start?: string;
  "Rare kills"?: number;
  "Damage dealt per second"?: number;
  "Experience per hour"?: number;
  "Kills per hour"?: number;
  "Damage dealt"?: number;
  "Damage taken per second"?: number;
  "Rare kills per hour"?: number;
  Kills?: number;
  "Raw gains"?: number;
  "Raw gains per hour"?: number;
  Experience?: number;
}
export interface PxGHuntData {
  Drops?: DropItem[];
  Supplies?: SupplyItem[];
  Damage?: DamageEntry[];
  "Enemies Defeated"?: EnemyDefeated[];
  Experience?: ExperienceEntry[];
  Session?: SessionData;
}
export type Metric = number | null;
export interface NormalizedItem {
  name: string;
  count: number;
  unitPrice: number;
  total: number;
  share: Metric;
  ignored: boolean;
  variablePrice: boolean;
}
export type NormalizedDrop = NormalizedItem;
export type NormalizedSupply = NormalizedItem;
export interface NormalizedEnemy {
  name: string;
  count: number;
  share: Metric;
  rare: boolean;
  ignored: boolean;
}
export interface DamageGroup {
  name: string;
  dealt: number;
  taken: number;
  dealtShare: Metric;
  takenShare: Metric;
}
export interface HuntInsight {
  title: string;
  name: string;
  detail: string;
  kind: "supply" | "drop" | "enemy" | "element";
}
export interface HuntAnalysis {
  player: string;
  session: {
    start?: string;
    durationSeconds: Metric;
    durationFormatted: string;
    status?: string;
    id?: number;
    type?: string;
    pausedSeconds?: number;
  };
  financial: {
    rawGains: Metric;
    supplies: Metric;
    profit: Metric;
    rawGainsPerHour: Metric;
    suppliesPerHour: Metric;
    profitPerHour: Metric;
    profitPerMinute: Metric;
    profitPerKill: Metric;
    lootPerKill: Metric;
    supplyPerKill: Metric;
    lootSupplyRatio: Metric;
  };
  experience: {
    total: Metric;
    perHour: Metric;
    perKill: Metric;
    timeToNextLevel?: string;
  };
  combat: {
    kills: Metric;
    killsPerHour: Metric;
    rareKills: Metric;
    rareKillsPerHour: Metric;
    damageDealt: Metric;
    damageTaken: Metric;
    dps: Metric;
    damageTakenPerSecond: Metric;
    damageDealtPerKill: Metric;
    damageTakenPerKill: Metric;
  };
  drops: NormalizedDrop[];
  supplies: NormalizedSupply[];
  enemies: NormalizedEnemy[];
  damageByEnemy: DamageGroup[];
  damageByElement: DamageGroup[];
  insights: HuntInsight[];
  warnings: string[];
}
