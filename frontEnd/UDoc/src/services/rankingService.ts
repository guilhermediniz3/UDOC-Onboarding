import api from "./api";

export interface RankingEntry {
  position: number;
  employeeid: number;
  employeename: string;
  employeephoto?: string;
  totalxp: number;
  trailscompleted: number;
  levelnum: number;
  levelname: string;
  levelicon: string;
}

export async function getRankingInterno(): Promise<RankingEntry[]> {
  const r = await api.get<RankingEntry[]>("/ranking/interno");
  return r.data;
}

export async function getRankingExterno(): Promise<RankingEntry[]> {
  const r = await api.get<RankingEntry[]>("/ranking/externo");
  return r.data;
}
