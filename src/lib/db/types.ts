import type { HuntAnalysis, PxGHuntData } from "../pxg/types";

export interface SavedHunt {
  id: string;
  duplicateKey: string;
  sessionId?: number;
  player: string;
  start?: string;
  startTimestamp?: number;
  createdAt: number;
  rawJson: PxGHuntData;
  analysis: HuntAnalysis;
}
export interface HuntSettings { diamondPrice: number | null }
export interface HuntBackup {
  version: "2.0";
  exportedAt: string;
  settings: HuntSettings;
  hunts: SavedHunt[];
}
