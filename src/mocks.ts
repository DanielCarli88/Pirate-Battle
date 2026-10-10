import { http, HttpResponse, delay } from "msw";
import type { MatchRecord, Page } from "./types";
import { playerId, records, saveRecords } from "./storage";

export type NetworkScenario = "success" | "empty" | "slow" | "timeout" | "connection" | "out-of-order" | "error";
const SCENARIO_KEY = "pirate-battle-scenario";
let responseSequence = 0;
export function scenario(): NetworkScenario { return (localStorage.getItem(SCENARIO_KEY) as NetworkScenario | null) ?? "success"; }
export function setScenario(value: NetworkScenario): void { localStorage.setItem(SCENARIO_KEY, value); }
export function resetMockData(): void { localStorage.removeItem("pirate-battle-records"); localStorage.removeItem("pirate-battle-pending"); }

function page(items: MatchRecord[], pageNumber: number): Page<MatchRecord> {
  const pageSize = 5; const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return { items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), page: pageNumber, pageSize, totalPages, totalItems: items.length };
}
function condition(): Response | null {
  const current = scenario();
  if (current === "error") return HttpResponse.json({ message: "Simulated network failure" }, { status: 503 });
  return null;
}
async function applyLatency(): Promise<void> {
  const current = scenario();
  if (current === "slow") await delay(1200);
  if (current === "out-of-order") {
    responseSequence += 1;
    await delay(responseSequence % 2 === 1 ? 1400 : 100);
  }
}
function isTimeout(): boolean { return scenario() === "timeout"; }
function isConnectionFailure(): boolean { return scenario() === "connection"; }
export const handlers = [
  http.get("/api/ranking", async ({ request }) => {
    const failure = condition(); if (failure) return failure;
    if (isTimeout()) await delay(6500);
    if (isConnectionFailure()) return HttpResponse.error();
    await applyLatency();
    if (scenario() === "empty") return HttpResponse.json(page([], 1));
    const url = new URL(request.url); const p = Number(url.searchParams.get("page") ?? 1);
    const all = [...records()].sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    return HttpResponse.json(page(all, p));
  }),
  http.get("/api/history", async ({ request }) => {
    const failure = condition(); if (failure) return failure;
    if (isTimeout()) await delay(6500);
    if (isConnectionFailure()) return HttpResponse.error();
    await applyLatency();
    const url = new URL(request.url); const p = Number(url.searchParams.get("page") ?? 1);
    const mine = records().filter((record) => record.playerId === (url.searchParams.get("playerId") ?? playerId)).sort((a, b) => b.date.localeCompare(a.date));
    return HttpResponse.json(page(scenario() === "empty" ? [] : mine, p));
  }),
  http.post("/api/matches", async ({ request }) => {
    const failure = condition(); if (failure) return failure;
    if (isTimeout()) await delay(6500);
    if (isConnectionFailure()) return HttpResponse.error();
    await applyLatency();
    const incoming = await request.json() as MatchRecord;
    const existing = records().find((record) => record.id === incoming.id);
    if (existing) return HttpResponse.json(existing);
    const next = [...records(), incoming]; saveRecords(next);
    return HttpResponse.json(incoming, { status: 201 });
  })
];
