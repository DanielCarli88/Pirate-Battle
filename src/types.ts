import type { GameConfig } from "./config";

export type EndReason = "time" | "destroyed";
export interface MatchRecord {
  id: string; playerId: string; playerName: string; date: string; score: number;
  duration: number; reason: EndReason; config: Pick<GameConfig, "sessionSeconds" | "spawnSeconds">;
}
export interface Page<T> { items: T[]; page: number; pageSize: number; totalPages: number; totalItems: number; }
