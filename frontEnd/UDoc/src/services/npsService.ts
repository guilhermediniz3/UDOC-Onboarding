import api from "./api";

export interface NpsQuestion {
  id?: number;
  referenceType: "card" | "trail";
  referenceId: number;
  enunciado: string;
  tipo: "faces" | "text";
  ordem?: number;
}

export interface NpsResponsePayload {
  questionId: number;
  score?: number | null;  // 1=Insatisfeito 2=Normal 3=Satisfeito 4=Muito Satisfeito
  resposta?: string;
}

export interface NpsDashboard {
  totalCardAccesses: number;
  totalRespostas: number;
  avgNpsScore: number;
  topCards: { id: number; title: string; access_count: number; score1?: number; score2?: number; score3?: number; score4?: number }[];
  npsTimeline: { dia: string; media: number }[];
  satisfactionDistribution: { score: number; total: number }[];
}

export async function getNpsQuestions(
  refType: "card" | "trail",
  refId: number
): Promise<NpsQuestion[]> {
  const r = await api.get<NpsQuestion[]>(`/nps/${refType}/${refId}/questions`);
  return r.data;
}

export async function replaceNpsQuestions(
  refType: "card" | "trail",
  refId: number,
  questions: NpsQuestion[]
): Promise<NpsQuestion[]> {
  const r = await api.put<NpsQuestion[]>(`/nps/${refType}/${refId}/questions`, questions);
  return r.data;
}

export async function submitNpsResponse(payload: NpsResponsePayload): Promise<void> {
  await api.post("/nps/responses", payload);
}

export async function incrementCardAccess(cardId: number): Promise<void> {
  await api.post(`/nps/cards/${cardId}/access`);
}

export async function getNpsDashboard(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<NpsDashboard> {
  const r = await api.get<NpsDashboard>("/nps/dashboard", { params });
  return r.data;
}

export async function generateNpsQuestions(
  refType: "card" | "trail",
  refId: number
): Promise<NpsQuestion[]> {
  const r = await api.post<NpsQuestion[]>(`/nps/${refType}/${refId}/questions/generate`);
  return r.data;
}

export async function getNpsConfig(
  refType: "card" | "trail",
  refId: number
): Promise<{ enabled: boolean }> {
  const r = await api.get<{ enabled: boolean }>(`/nps/${refType}/${refId}/config`);
  return r.data;
}

export async function setNpsConfig(
  refType: "card" | "trail",
  refId: number,
  enabled: boolean
): Promise<void> {
  await api.put(`/nps/${refType}/${refId}/config`, { enabled });
}
