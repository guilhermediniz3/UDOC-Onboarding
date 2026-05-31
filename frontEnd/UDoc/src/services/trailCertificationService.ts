import api from "./api";

export interface TrailQuestion {
  id?: number;
  trailId?: number;
  enunciado: string;
  tipo: "vf" | "multipla";
  opcoes?: string[];
  respostaCorreta: string;
  pontos: number;
  ordem?: number;
}

export interface CertificationConfig {
  id?: number;
  trailId?: number;
  notaMinima: number;
  totalPontos?: number;
  quantidadePerguntas?: number;
}

export async function getCertificationConfig(trailId: number): Promise<CertificationConfig> {
  const r = await api.get<CertificationConfig>(`/trails/${trailId}/certification`);
  return r.data;
}

export async function saveCertificationConfig(
  trailId: number,
  notaMinima: number
): Promise<CertificationConfig> {
  const r = await api.post<CertificationConfig>(`/trails/${trailId}/certification/config`, {
    notaMinima,
  });
  return r.data;
}

export async function getTrailQuestions(trailId: number): Promise<TrailQuestion[]> {
  const r = await api.get<TrailQuestion[]>(`/trails/${trailId}/questions`);
  return r.data;
}

export async function replaceTrailQuestions(
  trailId: number,
  questions: TrailQuestion[]
): Promise<TrailQuestion[]> {
  const r = await api.put<TrailQuestion[]>(`/trails/${trailId}/questions`, questions);
  return r.data;
}

export async function generateQuestionsWithGroq(trailId: number): Promise<TrailQuestion[]> {
  const r = await api.post<TrailQuestion[]>(`/trails/${trailId}/questions/generate`);
  return r.data;
}
