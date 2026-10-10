import type { MatchRecord } from "./types";
const RECORDS = "pirate-battle-records";
const PENDING = "pirate-battle-pending";
const PLAYER = "pirate-battle-player";
const LAST = "pirate-battle-last-result";

export const playerId = localStorage.getItem(PLAYER) ?? crypto.randomUUID();
localStorage.setItem(PLAYER, playerId);
export const playerName = "Captain " + playerId.slice(0, 4).toUpperCase();

export function records(): MatchRecord[] {
  try { return JSON.parse(localStorage.getItem(RECORDS) ?? "[]") as MatchRecord[]; } catch { return []; }
}
export function saveRecords(items: MatchRecord[]): void { localStorage.setItem(RECORDS, JSON.stringify(items)); }
export function pending(): MatchRecord[] {
  try { return JSON.parse(localStorage.getItem(PENDING) ?? "[]") as MatchRecord[]; } catch { return []; }
}
export function savePending(items: MatchRecord[]): void { localStorage.setItem(PENDING, JSON.stringify(items)); }
export function lastResult(): MatchRecord | null {
  try { return JSON.parse(localStorage.getItem(LAST) ?? "null") as MatchRecord | null; } catch { return null; }
}
export function saveLastResult(item: MatchRecord): void { localStorage.setItem(LAST, JSON.stringify(item)); }
