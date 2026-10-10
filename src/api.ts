import axios from "axios";
import type { MatchRecord, Page } from "./types";
import { playerId } from "./storage";

export const api = axios.create({ baseURL: "/api", timeout: 5000 });
export async function getRanking(page = 1): Promise<Page<MatchRecord>> {
  return (await api.get<Page<MatchRecord>>("/ranking", { params: { page } })).data;
}
export async function getHistory(page = 1): Promise<Page<MatchRecord>> {
  return (await api.get<Page<MatchRecord>>("/history", { params: { page, playerId } })).data;
}
export async function submitMatch(match: MatchRecord): Promise<MatchRecord> {
  return (await api.post<MatchRecord>("/matches", match)).data;
}
