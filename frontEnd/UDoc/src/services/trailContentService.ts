import api from "./api";

export interface TrailContentItem {
  id?: number;
  trailId?: number;
  tipo: "card" | "sala";
  referenciaId: number;
  ordem: number;
  nome?: string;
}

export async function getTrailContent(trailId: number): Promise<TrailContentItem[]> {
  const r = await api.get<TrailContentItem[]>(`/trails/${trailId}/content`);
  return r.data;
}

export async function replaceTrailContent(
  trailId: number,
  items: TrailContentItem[]
): Promise<TrailContentItem[]> {
  const r = await api.put<TrailContentItem[]>(`/trails/${trailId}/content`, items);
  return r.data;
}
