import api from "./api";

export interface XpSummary {
  totalXp: number;
  level: number;
  levelName: string;
  levelIcon: string;
  xpCurrentLevel: number;
  xpNextLevel: number;
  progressPct: number;
}

export async function getMyXp(): Promise<XpSummary> {
  const r = await api.get<XpSummary>("/xp/me");
  return r.data;
}

export async function getUserXp(userId: number): Promise<XpSummary> {
  const r = await api.get<XpSummary>(`/xp/${userId}`);
  return r.data;
}
