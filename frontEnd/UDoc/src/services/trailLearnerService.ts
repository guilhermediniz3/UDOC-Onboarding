import api from "./api";

/* ── Progresso ── */
export interface TrailProgress {
  trailId: number;
  currentItemIndex: number;
  completedItemsJson: string;
  status: "in_progress" | "completed";
  certified?: boolean;
  tempoTotalSegundos?: number;   // segundos acumulados de todas as sessões
  iniciadoEm?: string;           // ISO datetime
  concluidoEm?: string;          // ISO datetime
}

export async function getTrailProgress(trailId: number): Promise<TrailProgress> {
  const r = await api.get<TrailProgress>(`/my-trails/${trailId}/progress`);
  return r.data;
}

export async function saveTrailProgress(
  trailId: number,
  data: { currentItemIndex: number; completedItemsJson: string; status?: string; certified?: boolean }
): Promise<TrailProgress> {
  const r = await api.put<TrailProgress>(`/my-trails/${trailId}/progress`, data);
  return r.data;
}

/** Acumula segundos ao tempo total — chamado a cada 30s e no beforeunload */
export async function addTrailTime(
  trailId: number,
  additionalSeconds: number
): Promise<void> {
  if (additionalSeconds <= 0) return;
  await api.put(`/my-trails/${trailId}/time`, { additionalSeconds });
}

/* ── Quiz por Card ── */
export interface CardQuestion {
  id?: number;
  cardId?: number;
  enunciado: string;
  tipo: "vf" | "multipla";
  opcoes?: string[];
  respostaCorreta: string;
  pontos: number;
  ordem?: number;
}

export async function getCardQuestions(cardId: number): Promise<CardQuestion[]> {
  const r = await api.get<CardQuestion[]>(`/cards/${cardId}/questions`);
  return r.data;
}

export async function replaceCardQuestions(
  cardId: number,
  questions: CardQuestion[]
): Promise<CardQuestion[]> {
  const r = await api.put<CardQuestion[]>(`/cards/${cardId}/questions`, questions);
  return r.data;
}

/* ── Template de Certificado ── */
export interface CertificateTemplate {
  id?: number;
  logoBase64?: string;
  signatureName?: string;
  signatureTitle?: string;
  additionalContent?: string;
  primaryColor?: string;
}

export async function getCertificateTemplate(): Promise<CertificateTemplate> {
  const r = await api.get<CertificateTemplate>("/certificate-template");
  return r.data;
}

export async function saveCertificateTemplate(
  data: CertificateTemplate
): Promise<CertificateTemplate> {
  const r = await api.post<CertificateTemplate>("/certificate-template", data);
  return r.data;
}
