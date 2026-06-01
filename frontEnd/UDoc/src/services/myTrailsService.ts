import api from "./api";
import type { Trail } from "../types/Trail";

export interface TrailContentItem {
  ordem: number;
  tipo: "card" | "sala";
  // Card
  cardId?: number;
  cardTitle?: string;
  cardDescription?: string;
  cardIcon?: string;
  cardContent?: string;
  // Sala (somente vídeo)
  salaId?: number;
  salaTitle?: string;
  vimeoUrl?: string;
  youtubeUrl?: string;
}

export async function getMyTrails(): Promise<Trail[]> {
  const r = await api.get<Trail[]>("/my-trails");
  return r.data;
}

export async function getMyTrailContent(trailId: number): Promise<TrailContentItem[]> {
  const r = await api.get<TrailContentItem[]>(`/my-trails/${trailId}/content`);
  return r.data;
}
